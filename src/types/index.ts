export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliverySubmission {
  id?: number;
  referenceNumber: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  weight: number;
  serviceType: 'standard' | 'express';
  insurance: boolean;
  signatureRequired: boolean;
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paymentId?: string;
  paymentStatus?: 'unpaid' | 'completed' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}
