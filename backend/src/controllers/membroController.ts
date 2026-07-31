import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { Request, Response } from 'express';
import { createMembers, deactivateMember } from '../models/membroModel';
import { findByEmail, findById, findAllMembers, updateMember, findByIdComSenha, updatePassword } from '../models/membroModel';
import jwt from 'jsonwebtoken';


export async function cadastrarUser(req: Request, res: Response) {
    const {name, email, passwordUser, role, instrument, phone} = req.body

    const emailDuplicate = await query('SELECT * FROM membros WHERE email = $1', [email])
    if (emailDuplicate.rows.length > 0) {
        return res.status(400).json({message: 'Email duplicado'})
    }


    const hashPassword = await bcrypt.hash(passwordUser, 10)

    await createMembers (name, phone, instrument, email, role, hashPassword);

    return res.status(201).json({message: 'Usuario cadastrado com sucesso!'})
}

export async function loginUser(req: Request, res: Response) {
    const {email, passwordUser} = req.body

    const membro = await findByEmail(email) 
        if (!membro) {
        return res.status(400).json({message: 'Credenciais inválidas!'})
}
    const passwordCorrect = await bcrypt.compare(passwordUser, membro.senha)
        if (!passwordCorrect) {
            return res.status(400).json({message: 'Credenciais inválidas!'})
        }

        if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
        }

        const token = jwt.sign(
        { id: membro.id, papel: membro.papel },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }     
        )

        return res.status(200).json({ token, message: 'Login realizado com sucesso!'})
        
}

export async function myProfile(req: Request, res: Response) {
    if (!req.user) {
        throw new Error('req.user não configurado!')
    }

    const { id } = req.user
    
    const membro = await findById(id)

    return res.status(200).json(membro)
} 

export async function listAllMembers(req: Request, res: Response) {
    const membros = await findAllMembers();
    return res.status(200).json(membros);
}

export async function getMemberById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!id) {
        return res.status(400).json({message: 'Id inválido!'})
    }

    const membro = await findById(id)
    return res.status(200).json(membro);
}

export async function updateMemberController (req: Request, res: Response) {
    const id = Number(req.params.id);
    const {name, phone, instrument, email, role} = req.body;

    if ( !req.user ) {
        return res.status(401).json({message: 'Não autenticado!'})
    }

    if ( req.user.papel !== 'admin' && req.user.id !== id ) {
        return res.status(403).json({message: 'Não autorizado!'})
    }

    if (role && req.user.papel !== 'admin') {
        return res.status(403).json({message: 'Só admin pode alterar o papel!'})
    }

    if (email) {
        const emailExists = await findByEmail(email);
        if (emailExists && emailExists.id !== id) {
            return res.status(400).json({message: 'Email já cadastrado!'})
        }
    }

    if (!name || !phone || !instrument || !email) {
        return res.status(400).json({message: 'Todos os campos devem ser preechidos!'})
    }

    await updateMember(id, name, phone, instrument, email, role);

    return res.status(200).json({message: 'Alterações realizadas com sucesso!'})
}

export async function deactivateMemberController(req: Request, res: Response) {
    const id = Number(req.params.id);
    await deactivateMember(id, false)
    return res.status(200).json({message: 'Membro desativado com sucesso!'})
}

export async function updatePasswordController(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { senhaAtual, novaSenha } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado!' })
    }

    if (req.user.id !== id) {
        return res.status(403).json({ message: 'Não autorizado!' })
    }

    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ message: 'Informe a senha atual e a nova senha!' })
    }

    if (novaSenha.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres!' })
    }

    const membro = await findByIdComSenha(id);
    if (!membro) {
        return res.status(404).json({ message: 'Membro não encontrado!' })
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, membro.senha);
    if (!senhaCorreta) {
        return res.status(400).json({ message: 'Senha atual incorreta!' })
    }

    const hashPassword = await bcrypt.hash(novaSenha, 10);
    await updatePassword(id, hashPassword);

    return res.status(200).json({ message: 'Senha alterada com sucesso!' })
}