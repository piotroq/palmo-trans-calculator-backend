import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  sendEmailToOffice,
  sendEmailToCustomer,
} from '../services/emailService';
import type { DeliverySubmission } from '../types';
import { ApiError } from '../middleware/errorHandler';

// Mock baza danych (später: MySQL)
const submissions: Map<number, DeliverySubmission> = new Map();
let nextId = 1;

export class SubmissionsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        pickupAddress,
        pickupCoords,
        deliveryAddress,
        deliveryCoords,
        weight,
        serviceType,
        additionalServices,
        estimatedDistance,
        estimatedDuration,
        estimatedPrice,
        contactEmail,
        contactPhone,
        notes,
      } = req.body;

      // Walidacja
      if (!pickupAddress || !deliveryAddress || !weight || !serviceType) {
        throw new ApiError(400, 'Brak wymaganych pól');
      }

      if (!contactEmail || !contactPhone) {
        throw new ApiError(400, 'Podaj email i telefon');
      }

      const referenceNumber = `PTR-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      const submission: DeliverySubmission = {
        id: nextId++,
        referenceNumber,
        pickupAddress,
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        deliveryAddress,
        deliveryLat: deliveryCoords.lat,
        deliveryLng: deliveryCoords.lng,
        weight,
        serviceType,
        insurance: additionalServices?.insurance || false,
        signatureRequired: additionalServices?.signatureRequired || false,
        estimatedDistance,
        estimatedDuration,
        estimatedPrice,
        contactEmail,
        contactPhone,
        notes,
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: new Date(),
      };

      submissions.set(submission.id!, submission);

      // Wyślij emaili
      await Promise.all([
        sendEmailToOffice(submission),
        sendEmailToCustomer(submission),
      ]);

      res.status(201).json({
        success: true,
        id: submission.id,
        referenceNumber: submission.referenceNumber,
        message: 'Zgłoszenie przyjęte. Sprawdź email.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByReference(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { referenceNumber } = req.params;

      const submission = Array.from(submissions.values()).find(
        (s) => s.referenceNumber === referenceNumber
      );

      if (!submission) {
        throw new ApiError(404, 'Zgłoszenie nie znalezione');
      }

      res.json(submission);
    } catch (error) {
      next(error);
    }
  }

  static async getByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;

      const userSubmissions = Array.from(submissions.values())
        .filter((s) => s.contactEmail === email)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
        .slice(0, 10);

      res.json(userSubmissions);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'confirmed', 'rejected'].includes(status)) {
        throw new ApiError(400, 'Nieprawidłowy status');
      }

      const submission = submissions.get(parseInt(id as string));
      if (!submission) {
        throw new ApiError(404, 'Zgłoszenie nie znalezione');
      }

      submission.status = status;
      submission.updatedAt = new Date();

      res.json({ success: true, message: 'Status zaktualizowany' });
    } catch (error) {
      next(error);
    }
  }
}
