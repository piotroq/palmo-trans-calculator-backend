import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { ApiError } from '../middleware/errorHandler';

export class GeocodeController {
  static async geocode(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.body;

      if (!address || !address.trim()) {
        throw new ApiError(400, 'Adres jest wymagany');
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: address.trim(),
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );

      if (response.data.status !== 'OK' || !response.data.results?.[0]) {
        throw new ApiError(404, 'Adres nie znaleziony');
      }

      const location = response.data.results[0].geometry.location;

      res.json({
        lat: location.lat,
        lng: location.lng,
        formattedAddress: response.data.results[0].formatted_address,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        console.error('❌ Geocoding error:', error);
        next(new ApiError(500, 'Błąd geocodowania'));
      }
    }
  }
}
