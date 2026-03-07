<?php
/**
 * Palmo_Bookings_Table — WP_List_Table z listą zamówień
 *
 * Kolumny: Nr, Status, Trasa, Pojazd, Kwota, Płatność, Data
 * Filtry: status, search
 * Bulk actions: zmiana statusu
 *
 * @package PALMO_Bookings
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( 'WP_List_Table' ) ) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class Palmo_Bookings_Table extends WP_List_Table {

    public function __construct() {
        parent::__construct([
            'singular' => 'booking',
            'plural'   => 'bookings',
            'ajax'     => false,
        ]);
    }

    /**
     * Definicja kolumn
     */
    public function get_columns(): array {
        return [
            'cb'              => '<input type="checkbox" />',
            'booking_number'  => __( 'Buchungsnr.', 'palmo-bookings' ),
            'status'          => __( 'Status', 'palmo-bookings' ),
            'route'           => __( 'Route', 'palmo-bookings' ),
            'vehicle'         => __( 'Fahrzeug', 'palmo-bookings' ),
            'total'           => __( 'Summe', 'palmo-bookings' ),
            'payment_method'  => __( 'Zahlung', 'palmo-bookings' ),
            'payment_status'  => __( 'Zahlstatus', 'palmo-bookings' ),
            'created_at'      => __( 'Erstellt', 'palmo-bookings' ),
        ];
    }

    public function get_sortable_columns(): array {
        return [
            'booking_number' => [ 'booking_number', true ],
            'total'          => [ 'total', false ],
            'created_at'     => [ 'created_at', true ],
        ];
    }

    /**
     * Checkbox column
     */
    public function column_cb( $item ): string {
        return sprintf(
            '<input type="checkbox" name="booking_numbers[]" value="%s" />',
            esc_attr( $item['booking_number'] )
        );
    }

    /**
     * Booking number — link do szczegółów
     */
    public function column_booking_number( $item ): string {
        $detail_url = admin_url( 'admin.php?page=palmo-booking-detail&number=' . urlencode( $item['booking_number'] ) );

        $actions = [
            'view' => sprintf(
                '<a href="%s">%s</a>',
                esc_url( $detail_url ),
                __( 'Details', 'palmo-bookings' )
            ),
        ];

        return sprintf(
            '<strong><a href="%s" class="row-title">%s</a></strong>%s',
            esc_url( $detail_url ),
            esc_html( $item['booking_number'] ),
            $this->row_actions( $actions )
        );
    }

    /**
     * Status z kolorowym badge
     */
    public function column_status( $item ): string {
        $statuses = [
            'pending'    => [ 'Ausstehend', '#f0ad4e', '⏳' ],
            'confirmed'  => [ 'Bestätigt', '#5cb85c', '✅' ],
            'in_transit' => [ 'Unterwegs', '#5bc0de', '🚚' ],
            'delivered'  => [ 'Zugestellt', '#28a745', '📦' ],
            'cancelled'  => [ 'Storniert', '#d9534f', '❌' ],
        ];

        $s = $item['status'] ?? 'pending';
        $info = $statuses[ $s ] ?? [ ucfirst( $s ), '#999', '❓' ];

        return sprintf(
            '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;background:%s20;color:%s;">%s %s</span>',
            $info[1], $info[1], $info[2], esc_html( $info[0] )
        );
    }

    /**
     * Trasa: Pickup City → Delivery City
     */
    public function column_route( $item ): string {
        $from = $item['pickup_city'] ?? $item['pickup_postal_code'] ?? '—';
        $to   = $item['delivery_city'] ?? $item['delivery_postal_code'] ?? '—';
        $km   = $item['distance_km'] ?? '';

        $route = esc_html( $from ) . ' → ' . esc_html( $to );
        if ( $km ) {
            $route .= sprintf( ' <small style="color:#999;">(%s km)</small>', esc_html( $km ) );
        }

        return $route;
    }

    /**
     * Pojazd
     */
    public function column_vehicle( $item ): string {
        $id  = $item['vehicle_id'] ?? '—';
        $cat = $item['vehicle_category'] ?? '';

        $badge = $cat === 'express'
            ? '<span style="background:#FFD700;color:#1a1a1a;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;">EXPRESS</span>'
            : '<span style="background:#5bc0de;color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;">LKW</span>';

        return $badge . ' ' . esc_html( $id );
    }

    /**
     * Kwota
     */
    public function column_total( $item ): string {
        $total = isset( $item['total'] ) ? number_format( (float) $item['total'], 2, ',', '.' ) : '—';
        return '<strong style="color:#FFD700;">' . esc_html( $total ) . ' zł</strong>';
    }

    /**
     * Payment method
     */
    public function column_payment_method( $item ): string {
        $methods = [
            'rechnung'    => '🧾 Rechnung',
            'przelewy24'  => '🏦 Przelewy24',
            'paypal'      => '💳 PayPal',
            'kreditkarte' => '💎 Kreditkarte',
        ];
        $m = $item['payment_method'] ?? '—';
        return $methods[ $m ] ?? esc_html( $m );
    }

    /**
     * Payment status
     */
    public function column_payment_status( $item ): string {
        $s = $item['payment_status'] ?? 'pending';
        $colors = [
            'pending'   => '#f0ad4e',
            'paid'      => '#28a745',
            'failed'    => '#d9534f',
            'refunded'  => '#6c757d',
        ];
        $color = $colors[ $s ] ?? '#999';
        return sprintf(
            '<span style="color:%s;font-weight:600;font-size:12px;">%s</span>',
            $color, esc_html( ucfirst( $s ) )
        );
    }

    /**
     * Data utworzenia
     */
    public function column_created_at( $item ): string {
        if ( empty( $item['created_at'] ) ) return '—';

        $timestamp = strtotime( $item['created_at'] );
        $date = wp_date( 'd.m.Y', $timestamp );
        $time = wp_date( 'H:i', $timestamp );

        return esc_html( $date ) . '<br><small style="color:#999;">' . esc_html( $time ) . '</small>';
    }

    /**
     * Filtry nad tabelą
     */
    protected function extra_tablenav( $which ): void {
        if ( 'top' !== $which ) return;

        $current_status = sanitize_text_field( $_GET['status'] ?? '' );
        $statuses = [
            ''           => __( 'Alle Status', 'palmo-bookings' ),
            'pending'    => __( 'Ausstehend', 'palmo-bookings' ),
            'confirmed'  => __( 'Bestätigt', 'palmo-bookings' ),
            'in_transit' => __( 'Unterwegs', 'palmo-bookings' ),
            'delivered'  => __( 'Zugestellt', 'palmo-bookings' ),
            'cancelled'  => __( 'Storniert', 'palmo-bookings' ),
        ];

        echo '<div class="alignleft actions">';
        echo '<select name="status">';
        foreach ( $statuses as $val => $label ) {
            printf(
                '<option value="%s" %s>%s</option>',
                esc_attr( $val ),
                selected( $current_status, $val, false ),
                esc_html( $label )
            );
        }
        echo '</select>';
        submit_button( __( 'Filtern', 'palmo-bookings' ), '', 'filter_action', false );
        echo '</div>';
    }

    /**
     * Przygotuj dane
     */
    public function prepare_items(): void {
        $per_page = 20;
        $page     = $this->get_pagenum();

        $params = [
            'page'     => $page,
            'per_page' => $per_page,
            'status'   => sanitize_text_field( $_GET['status'] ?? '' ),
            'search'   => sanitize_text_field( $_GET['s'] ?? '' ),
        ];

        $result = Palmo_API_Client::get_bookings( $params );

        $this->items = $result['bookings'] ?? [];

        $total = (int) ( $result['total'] ?? 0 );

        $this->set_pagination_args([
            'total_items' => $total,
            'per_page'    => $per_page,
            'total_pages' => ceil( $total / $per_page ),
        ]);

        $this->_column_headers = [
            $this->get_columns(),
            [], // hidden
            $this->get_sortable_columns(),
        ];
    }

    /**
     * Komunikat gdy brak danych
     */
    public function no_items(): void {
        echo '<p style="padding:20px;text-align:center;color:#999;">';
        esc_html_e( 'Keine Buchungen gefunden. Stellen Sie sicher, dass der Backend-Server läuft und die API-URL korrekt konfiguriert ist.', 'palmo-bookings' );
        echo '</p>';
    }
}
