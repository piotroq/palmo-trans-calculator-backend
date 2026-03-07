<?php
/**
 * Palmo_Dashboard_Widget — Widget na WP Dashboard
 *
 * Pokazuje: ostatnie 5 bookingów + mini stats (total, pending, revenue)
 *
 * @package PALMO_Bookings
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Palmo_Dashboard_Widget {

    public static function init(): void {
        add_action( 'wp_dashboard_setup', [ __CLASS__, 'register' ] );
    }

    public static function register(): void {
        wp_add_dashboard_widget(
            'palmo_bookings_widget',
            '🚚 PALMO-TRANS — Letzte Buchungen',
            [ __CLASS__, 'render' ]
        );
    }

    public static function render(): void {
        // Stats
        $stats = Palmo_API_Client::get_stats();

        if ( ! empty( $stats['error'] ) ) {
            echo '<p style="color:#d9534f;">❌ Backend nicht erreichbar: ' . esc_html( $stats['error'] ) . '</p>';
            echo '<p><a href="' . esc_url( admin_url( 'options-general.php?page=palmo-bookings-settings' ) ) . '">Einstellungen →</a></p>';
            return;
        }

        // Mini stats bar
        $revenue = isset( $stats['revenue'] ) ? number_format( (float) $stats['revenue'], 2, ',', '.' ) : '0,00';
        echo '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
        printf( '<div style="flex:1;text-align:center;padding:8px;background:#f9f9f9;border-radius:6px;"><strong style="font-size:20px;">%s</strong><br><small style="color:#999;">Gesamt</small></div>', esc_html( $stats['total'] ?? 0 ) );
        printf( '<div style="flex:1;text-align:center;padding:8px;background:#fff3cd;border-radius:6px;"><strong style="font-size:20px;">%s</strong><br><small style="color:#999;">Ausstehend</small></div>', esc_html( $stats['pending'] ?? 0 ) );
        printf( '<div style="flex:1;text-align:center;padding:8px;background:#f0f0f0;border-radius:6px;"><strong style="font-size:20px;color:#FFD700;">%s zł</strong><br><small style="color:#999;">Umsatz</small></div>', esc_html( $revenue ) );
        echo '</div>';

        // Last 5 bookings
        $result = Palmo_API_Client::get_bookings([
            'page'     => 1,
            'per_page' => 5,
        ]);

        $bookings = $result['bookings'] ?? [];

        if ( empty( $bookings ) ) {
            echo '<p style="color:#999;text-align:center;">Keine Buchungen vorhanden.</p>';
        } else {
            echo '<table class="widefat striped" style="font-size:12px;">';
            echo '<thead><tr><th>Nr.</th><th>Route</th><th>Summe</th><th>Status</th></tr></thead>';
            echo '<tbody>';
            foreach ( $bookings as $b ) {
                $detail_url = admin_url( 'admin.php?page=palmo-booking-detail&number=' . urlencode( $b['booking_number'] ) );
                $total = isset( $b['total'] ) ? number_format( (float) $b['total'], 2, ',', '.' ) : '—';
                $from = $b['pickup_city'] ?? $b['pickup_postal_code'] ?? '?';
                $to   = $b['delivery_city'] ?? $b['delivery_postal_code'] ?? '?';

                printf(
                    '<tr><td><a href="%s"><strong>%s</strong></a></td><td>%s → %s</td><td style="color:#FFD700;font-weight:600;">%s zł</td><td>%s</td></tr>',
                    esc_url( $detail_url ),
                    esc_html( $b['booking_number'] ),
                    esc_html( $from ),
                    esc_html( $to ),
                    esc_html( $total ),
                    esc_html( ucfirst( $b['status'] ?? 'pending' ) )
                );
            }
            echo '</tbody></table>';
        }

        echo '<p style="text-align:right;margin-top:8px;"><a href="' . esc_url( admin_url( 'admin.php?page=palmo-bookings' ) ) . '">Alle Buchungen →</a></p>';
    }
}
