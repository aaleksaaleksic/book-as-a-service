import { AxiosInstance } from 'axios';
import { PublisherResponseDTO, PublisherCreateDTO } from './types/publishers.types';

export const publishersApi = {
  getAllPublishers: (client: AxiosInstance) => {
    return client.get<PublisherResponseDTO[]>('/api/v1/publishers');
  },

  getPublisherById: (client: AxiosInstance, id: number) => {
    return client.get<PublisherResponseDTO>(`/api/v1/publishers/${id}`);
  },

  createPublisher: (client: AxiosInstance, data: PublisherCreateDTO) => {
    return client.post<{ success: boolean; message: string; publisher: PublisherResponseDTO }>('/api/v1/publishers', data);
  },

  updatePublisher: (client: AxiosInstance, id: number, data: PublisherCreateDTO) => {
    return client.put<{ success: boolean; message: string; publisher: PublisherResponseDTO }>(`/api/v1/publishers/${id}`, data);
  },

  deletePublisher: (client: AxiosInstance, id: number) => {
    return client.delete<{ success: boolean; message: string }>(`/api/v1/publishers/${id}`);
  },
};
