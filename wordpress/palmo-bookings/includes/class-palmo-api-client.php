<?php
/**
 * Palmo_API_Client — Komunikacja z backendem PALMO-TRANS
 *
 * Pobiera dane z REST API backendu (GET /api/v2/bookings, /booking/:number)
 * Używa wp_remote_get() — natywny HTTP client WordPressa.
 *
 * @package PALMO_Bookings
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Palmo_API_Client {

    /**
     * Pobierz URL API z ustawień
     */
    private static function api_url(): string {
        return rtrim( get_option( 'palmo_bookings_api_url', PALMO_BOOKINGS_DEFAULT_API ), '/' );
    }

    /**
     * GET request do API
     *
     * @param string $endpoint np. '/api/v2/bookings'
     * @param array  $query    Query params
     * @return array|WP_Error
     */
    private static function get( string $endpoint, array $query = [] ) {
        $url = self::api_url() . $endpoint;
        if ( ! empty( $query ) ) {
            $url .= '?' . http_build_query( $query );
        }

        $response = wp_remote_get( $url, [
            'timeout' => 15,
            'headers' => [
                'Accept' => 'application/json',
            ],
        ]);

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( $code >= 400 ) {
            $msg = $data['error'] ?? "HTTP {$code}";
            return new WP_Error( 'api_error', $msg, [ 'status' => $code ] );
        }

        return $data;
    }

    /**
     * POST request do API
     */
    private static function post( string $endpoint, array $body = [] ) {
        $url = self::api_url() . $endpoint;

        $response = wp_remote_post( $url, [
            'timeout' => 15,
            'headers' => [
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ],
            'body' => wp_json_encode( $body ),
        ]);

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( $code >= 400 ) {
            $msg = $data['error'] ?? "HTTP {$code}";
            return new WP_Error( 'api_error', $msg, [ 'status' => $code ] );
        }

        return $data;
    }

    /**
     * Pobierz listę bookingów
     *
     * @param array $params [page, per_page, status, search]
     * @return array { bookings: [], total: int, page: int, per_page: int }
     */
    public static function get_bookings( array $params = [] ): array {
        $defaults = [
            'page'     => 1,
            'per_page' => 20,
            'status'   => '',
            'search'   => '',
        ];
        $params = wp_parse_args( $params, $defaults );

        $result = self::get( '/api/v2/bookings', array_filter( $params ) );

        if ( is_wp_error( $result ) ) {
            return [
                'bookings' => [],
                'total'    => 0,
                'page'     => $params['page'],
                'per_page' => $params['per_page'],
                'error'    => $result->get_error_message(),
            ];
        }

        return $result['data'] ?? [
            'bookings' => [],
            'total'    => 0,
            'page'     => $params['page'],
            'per_page' => $params['per_page'],
        ];
    }

    /**
     * Pobierz pojedynczy booking po numerze
     *
     * @param string $booking_number np. 'PT-2026-00001'
     * @return array|WP_Error
     */
    public static function get_booking( string $booking_number ) {
        $result = self::get( "/api/v2/booking/{$booking_number}" );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return $result['data'] ?? [];
    }

    /**
     * Aktualizuj status bookingu
     *
     * @param string $booking_number
     * @param string $status  pending|confirmed|in_transit|delivered|cancelled
     * @return array|WP_Error
     */
    public static function update_status( string $booking_number, string $status ) {
        return self::post( "/api/v2/booking/{$booking_number}/status", [
            'status' => $status,
        ]);
    }

    /**
     * Dashboard stats
     *
     * @return array { total: int, pending: int, confirmed: int, revenue: float }
     */
    public static function get_stats(): array {
        $result = self::get( '/api/v2/bookings/stats' );

        if ( is_wp_error( $result ) ) {
            return [
                'total'      => 0,
                'pending'    => 0,
                'confirmed'  => 0,
                'in_transit' => 0,
                'delivered'  => 0,
                'cancelled'  => 0,
                'revenue'    => 0,
                'error'      => $result->get_error_message(),
            ];
        }

        return $result['data'] ?? [];
    }

    /**
     * Test połączenia z API
     */
    public static function test_connection(): array {
        $result = self::get( '/health' );

        if ( is_wp_error( $result ) ) {
            return [
                'connected' => false,
                'error'     => $result->get_error_message(),
            ];
        }

        return [
            'connected' => true,
            'status'    => $result['status'] ?? 'OK',
            'timestamp' => $result['timestamp'] ?? '',
        ];
    }
}
