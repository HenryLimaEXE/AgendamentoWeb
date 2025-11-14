import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarefa } from '../shared/models/tarefa.interface';

@Injectable({
  providedIn: 'root'
})
export class TarefaService {
  private apiUrl = 'http://localhost:5052/api';

  constructor(private http: HttpClient) { }

  getTarefasByUser(userId: number): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(`${this.apiUrl}/tarefas/usuario/${userId}`);
  }

  criarTarefa(tarefa: any): Observable<Tarefa> {
    return this.http.post<Tarefa>(`${this.apiUrl}/tarefas`, tarefa);
  }

  atualizarTarefa(id: number, tarefa: any): Observable<Tarefa> {
    return this.http.put<Tarefa>(`${this.apiUrl}/tarefas/${id}`, tarefa);
  }

  excluirTarefa(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tarefas/${id}`);
  }

  alternarStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tarefas/${id}/alternar-status`, {});
  }

  moverParaFazendo(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tarefas/${id}/mover-fazendo`, {});
  }
}