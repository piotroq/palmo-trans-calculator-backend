<?php
/**
 * Palmo_Admin_Pages — Strony admina: lista + szczegóły bookingu
 *
 * @package PALMO_Bookings
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Palmo_Admin_Pages {

    public static function init(): void {
        add_action( 'admin_menu', [ __CLASS__, 'register_pages' ] );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_styles' ] );
    }

    /**
     * Rejestracja stron w menu admina
     */
    public static function register_pages(): void {
        // Główna strona — ikona truck 🚚
        add_menu_page(
            __( 'PALMO Buchungen', 'palmo-bookings' ),
            __( 'Buchungen', 'palmo-bookings' ),
            'manage_options',
            'palmo-bookings',
            [ __CLASS__, 'render_list_page' ],
            'dashicons-car',
            26
        );

        // Subpage: szczegóły (ukryta w menu)
        add_submenu_page(
            null, // parent_slug = null → nie widoczne w menu
            __( 'Buchung Details', 'palmo-bookings' ),
            __( 'Details', 'palmo-bookings' ),
            'manage_options',
            'palmo-booking-detail',
            [ __CLASS__, 'render_detail_page' ]
        );
    }

    /**
     * CSS admin styles
     */
    public static function enqueue_styles( $hook ): void {
        if ( strpos( $hook, 'palmo-booking' ) === false ) return;

        wp_add_inline_style( 'wp-admin', '
            .palmo-wrap { max-width: 1200px; }
            .palmo-wrap h1 { display: flex; align-items: center; gap: 8px; }
            .palmo-wrap h1 .dashicons { font-size: 28px; color: #FFD700; }

            .palmo-stats { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
            .palmo-stat-card {
                background: #fff; border: 1px solid #ddd; border-radius: 8px;
                padding: 16px 20px; min-width: 140px; flex: 1;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .palmo-stat-card .number {
                font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1;
            }
            .palmo-stat-card .label {
                font-size: 12px; color: #999; margin-top: 4px; text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .palmo-stat-card.gold .number { color: #FFD700; }

            .palmo-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .palmo-detail-card {
                background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .palmo-detail-card h3 {
                margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #FFD700;
                font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;
            }
            .palmo-detail-card table { width: 100%; }
            .palmo-detail-card td { padding: 4px 0; font-size: 13px; vertical-align: top; }
            .palmo-detail-card td:first-child { color: #999; width: 140px; }

            .palmo-connection-ok { color: #28a745; font-weight: 600; }
            .palmo-connection-err { color: #d9534f; font-weight: 600; }

            @media (max-width: 782px) {
                .palmo-detail-grid { grid-template-columns: 1fr; }
                .palmo-stats { flex-direction: column; }
            }
        ' );
    }

    /**
     * ─── Lista bookingów ─────────────────────────────────────
     */
    public static function render_list_page(): void {
        $table = new Palmo_Bookings_Table();
        $table->prepare_items();

        // Connection test
        $conn = Palmo_API_Client::test_connection();

        echo '<div class="wrap palmo-wrap">';

        echo '<h1><span class="dashicons dashicons-car"></span> ' . esc_html__( 'PALMO-TRANS Buchungen', 'palmo-bookings' ) . '</h1>';

        // Connection status
        if ( $conn['connected'] ) {
            echo '<p class="palmo-connection-ok">✅ Backend verbunden (' . esc_html( get_option( 'palmo_bookings_api_url' ) ) . ')</p>';
        } else {
            echo '<p class="palmo-connection-err">❌ Backend nicht erreichbar: ' . esc_html( $conn['error'] ?? 'Unknown' ) . '</p>';
            echo '<p><a href="' . esc_url( admin_url( 'options-general.php?page=palmo-bookings-settings' ) ) . '">API-Einstellungen prüfen →</a></p>';
        }

        // Stats cards
        $stats = Palmo_API_Client::get_stats();
        if ( empty( $stats['error'] ) ) {
            echo '<div class="palmo-stats">';
            self::stat_card( $stats['total'] ?? 0, 'Gesamt' );
            self::stat_card( $stats['pending'] ?? 0, 'Ausstehend', '' );
            self::stat_card( $stats['confirmed'] ?? 0, 'Bestätigt', '' );
            self::stat_card( $stats['in_transit'] ?? 0, 'Unterwegs', '' );
            self::stat_card( $stats['delivered'] ?? 0, 'Zugestellt', '' );

            $revenue = isset( $stats['revenue'] ) ? number_format( (float) $stats['revenue'], 2, ',', '.' ) . ' zł' : '—';
            echo '<div class="palmo-stat-card gold"><div class="number">' . esc_html( $revenue ) . '</div><div class="label">Umsatz</div></div>';

            echo '</div>';
        }

        // Search box
        echo '<form method="get">';
        echo '<input type="hidden" name="page" value="palmo-bookings" />';
        $table->search_box( __( 'Suchen', 'palmo-bookings' ), 'booking_search' );
        echo '</form>';

        // Table
        echo '<form method="get">';
        echo '<input type="hidden" name="page" value="palmo-bookings" />';
        $table->display();
        echo '</form>';

        echo '</div>';
    }

    private static function stat_card( $number, string $label, string $class = '' ): void {
        printf(
            '<div class="palmo-stat-card %s"><div class="number">%s</div><div class="label">%s</div></div>',
            esc_attr( $class ),
            esc_html( $number ),
            esc_html( $label )
        );
    }

    /**
     * ─── Szczegóły bookingu ──────────────────────────────────
     */
    public static function render_detail_page(): void {
        $number = sanitize_text_field( $_GET['number'] ?? '' );

        if ( empty( $number ) ) {
            echo '<div class="wrap"><p>Keine Buchungsnummer angegeben.</p></div>';
            return;
        }

        $booking = Palmo_API_Client::get_booking( $number );

        if ( is_wp_error( $booking ) ) {
            echo '<div class="wrap"><div class="notice notice-error"><p>' . esc_html( $booking->get_error_message() ) . '</p></div></div>';
            return;
        }

        $b = $booking; // shorthand

        echo '<div class="wrap palmo-wrap">';

        // Back link
        echo '<p><a href="' . esc_url( admin_url( 'admin.php?page=palmo-bookings' ) ) . '">← ' . esc_html__( 'Zurück zur Liste', 'palmo-bookings' ) . '</a></p>';

        // Header
        echo '<h1><span class="dashicons dashicons-car"></span> Buchung ' . esc_html( $number ) . '</h1>';

        // Status + Total bar
        echo '<div class="palmo-stats">';
        echo '<div class="palmo-stat-card"><div class="number">' . esc_html( ucfirst( $b['status'] ?? 'pending' ) ) . '</div><div class="label">Status</div></div>';
        $total = isset( $b['total'] ) ? number_format( (float) $b['total'], 2, ',', '.' ) : '—';
        echo '<div class="palmo-stat-card gold"><div class="number">' . esc_html( $total ) . ' zł</div><div class="label">Gesamtsumme</div></div>';
        echo '<div class="palmo-stat-card"><div class="number">' . esc_html( $b['payment_method'] ?? '—' ) . '</div><div class="label">Zahlmethode</div></div>';
        echo '<div class="palmo-stat-card"><div class="number">' . esc_html( $b['distance_km'] ?? '—' ) . ' km</div><div class="label">Entfernung</div></div>';
        echo '</div>';

        // Detail Grid
        echo '<div class="palmo-detail-grid">';

        // ── Abholung ──
        self::detail_card( 'Abholung', [
            'Firma'     => $b['pickup_company'] ?? '',
            'Name'      => trim( ( $b['pickup_first_name'] ?? '' ) . ' ' . ( $b['pickup_last_name'] ?? '' ) ),
            'Straße'    => $b['pickup_street'] ?? '',
            'PLZ/Ort'   => trim( ( $b['pickup_country'] ?? '' ) . ' ' . ( $b['pickup_postal_code'] ?? '' ) . ' ' . ( $b['pickup_city'] ?? '' ) ),
            'Telefon'   => $b['pickup_phone'] ?? '',
            'Referenz'  => $b['pickup_reference'] ?? '',
            'Datum'     => $b['pickup_date'] ?? '',
            'Zeitfenster' => $b['pickup_time_window'] ?? '',
            'Zeitslot'  => $b['pickup_time_slot'] ?? '',
        ]);

        // ── Zustellung ──
        self::detail_card( 'Zustellung', [
            'Firma'     => $b['delivery_company'] ?? '',
            'Name'      => trim( ( $b['delivery_first_name'] ?? '' ) . ' ' . ( $b['delivery_last_name'] ?? '' ) ),
            'Straße'    => $b['delivery_street'] ?? '',
            'PLZ/Ort'   => trim( ( $b['delivery_country'] ?? '' ) . ' ' . ( $b['delivery_postal_code'] ?? '' ) . ' ' . ( $b['delivery_city'] ?? '' ) ),
            'Telefon'   => $b['delivery_phone'] ?? '',
            'Referenz'  => $b['delivery_reference'] ?? '',
            'Datum'     => $b['delivery_date'] ?? '',
            'Zeitfenster' => $b['delivery_time_window'] ?? '',
            'Zeitslot'  => $b['delivery_time_slot'] ?? '',
        ]);

        // ── Rechnungsadresse ──
        self::detail_card( 'Rechnungsadresse', [
            'Firma'       => $b['invoice_company'] ?? '',
            'Name'        => trim( ( $b['invoice_first_name'] ?? '' ) . ' ' . ( $b['invoice_last_name'] ?? '' ) ),
            'Straße'      => $b['invoice_street'] ?? '',
            'PLZ/Ort'     => trim( ( $b['invoice_country'] ?? '' ) . ' ' . ( $b['invoice_postal_code'] ?? '' ) . ' ' . ( $b['invoice_city'] ?? '' ) ),
            'E-Mail'      => $b['invoice_email'] ?? '',
            'Telefon'     => $b['invoice_phone'] ?? '',
            'USt-ID'      => $b['invoice_vat_id'] ?? '',
            'Referenz'    => $b['invoice_reference'] ?? '',
        ]);

        // ── Fahrzeug & Preis ──
        self::detail_card( 'Fahrzeug & Preis', [
            'Fahrzeug ID'     => $b['vehicle_id'] ?? '',
            'Kategorie'       => $b['vehicle_category'] ?? '',
            'Basispreis'      => self::fmt_zl( $b['vehicle_base_price'] ?? 0 ),
            'Distanzgebühr'   => self::fmt_zl( $b['distance_charge'] ?? 0 ),
            'Services'        => self::fmt_zl( $b['services_total'] ?? 0 ),
            'Zeitfenster-Zuschlag' => self::fmt_zl( $b['time_window_surcharge'] ?? 0 ),
            'Transaktionsgebühr' => self::fmt_zl( $b['transaction_fee'] ?? 0 ),
            'MwSt.-Satz'      => ( $b['vat_rate'] ?? 0 ) . '%',
            'MwSt.-Betrag'    => self::fmt_zl( $b['vat_amount'] ?? 0 ),
            'Gesamtsumme'     => '<strong style="color:#FFD700;font-size:16px;">' . self::fmt_zl( $b['total'] ?? 0 ) . '</strong>',
        ]);

        echo '</div>'; // .palmo-detail-grid

        // ── Sendung / Packages ──
        if ( ! empty( $b['packages'] ) ) {
            $packages = is_string( $b['packages'] ) ? json_decode( $b['packages'], true ) : $b['packages'];
            if ( is_array( $packages ) && count( $packages ) > 0 ) {
                echo '<div class="palmo-detail-card" style="margin-top:20px;">';
                echo '<h3>Sendung (' . count( $packages ) . ' Packstück' . ( count( $packages ) > 1 ? 'e' : '' ) . ')</h3>';
                echo '<table class="widefat striped"><thead><tr>';
                echo '<th>Kategorie</th><th>Beschreibung</th><th>Anzahl</th><th>Maße (cm)</th><th>Gewicht</th><th>Stapelbar</th>';
                echo '</tr></thead><tbody>';
                foreach ( $packages as $pkg ) {
                    printf(
                        '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s × %s × %s</td><td>%s kg</td><td>%s</td></tr>',
                        esc_html( $pkg['categoryId'] ?? '—' ),
                        esc_html( $pkg['description'] ?? '—' ),
                        esc_html( $pkg['quantity'] ?? 1 ),
                        esc_html( $pkg['length'] ?? 0 ),
                        esc_html( $pkg['width'] ?? 0 ),
                        esc_html( $pkg['height'] ?? 0 ),
                        esc_html( $pkg['weight'] ?? 0 ),
                        ! empty( $pkg['stackable'] ) ? '✅' : '❌'
                    );
                }
                echo '</tbody></table></div>';
            }
        }

        // Additional info
        if ( ! empty( $b['additional_info'] ) ) {
            echo '<div class="palmo-detail-card" style="margin-top:20px;">';
            echo '<h3>Weitere Infos</h3>';
            echo '<p>' . esc_html( $b['additional_info'] ) . '</p>';
            echo '</div>';
        }

        // Timestamps
        echo '<div class="palmo-detail-card" style="margin-top:20px;">';
        echo '<h3>Zeitstempel</h3>';
        echo '<table>';
        echo '<tr><td>Erstellt</td><td>' . esc_html( $b['created_at'] ?? '—' ) . '</td></tr>';
        echo '<tr><td>Aktualisiert</td><td>' . esc_html( $b['updated_at'] ?? '—' ) . '</td></tr>';
        echo '<tr><td>Bezahlt</td><td>' . esc_html( $b['paid_at'] ?? '—' ) . '</td></tr>';
        echo '</table></div>';

        echo '</div>'; // .wrap
    }

    /**
     * Render detail card
     */
    private static function detail_card( string $title, array $rows ): void {
        echo '<div class="palmo-detail-card"><h3>' . esc_html( $title ) . '</h3><table>';
        foreach ( $rows as $label => $value ) {
            if ( empty( $value ) || $value === '0' || $value === '0,00 zł' ) continue;
            echo '<tr><td>' . esc_html( $label ) . '</td><td>' . wp_kses_post( $value ) . '</td></tr>';
        }
        echo '</table></div>';
    }

    private static function fmt_zl( $amount ): string {
        return number_format( (float) $amount, 2, ',', '.' ) . ' zł';
    }
}
