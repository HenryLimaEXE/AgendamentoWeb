export interface Tarefa {
  id: number;
  titulo: string;        // ✅ DEVE ser 'titulo' (não 'tarefa')
  dataLimite: string;
  descricao: string;
  concluida: boolean;
  status: string;
  userId: number;
}