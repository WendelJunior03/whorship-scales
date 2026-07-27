import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { Request, Response } from 'express';
import { createMembers } from '../models/membroModel';
import { findByEmail, findById } from '../models/membroModel';
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