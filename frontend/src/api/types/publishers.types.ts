export interface PublisherResponseDTO {
  id: number;
  name: string;
  description?: string;
  website?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PublisherCreateDTO {
  name: string;
  description?: string;
  website?: string;
}
