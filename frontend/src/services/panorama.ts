import { api } from './api';
import { Panorama } from '@/types';

/** `mes` = 'YYYY-MM'. */
export async function getPanorama(mes: string): Promise<Panorama> {
  const { data } = await api.get<Panorama>('/panorama', { params: { mes } });
  return data;
}
