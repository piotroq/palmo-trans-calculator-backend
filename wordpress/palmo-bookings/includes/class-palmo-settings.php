<?php
/**
 * Palmo_Settings — Einstellungen: API URL + Connection Test
 *
 * Settings > PALMO-TRANS Buchungen
 *
 * @package PALMO_Bookings
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Palmo_Settings {

    public static function init(): void {
        add_action( 'admin_menu', [ __CLASS__, 'register_page' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
    }

    public static function register_page(): void {
        add_options_page(
            __( 'PALMO-TRANS Buchungen', 'palmo-bookings' ),
            __( 'PALMO Buchungen', 'palmo-bookings' ),
            'manage_options',
            'palmo-bookings-settings',
            [ __CLASS__, 'render' ]
        );
    }

    public static function register_settings(): void {
        register_setting( 'palmo_bookings_settings', 'palmo_bookings_api_url', [
            'type'              => 'string',
            'sanitize_callback' => function( $val ) {
                return esc_url_raw( rtrim( trim( $val ), '/' ) );
            },
            'default'           => PALMO_BOOKINGS_DEFAULT_API,
        ]);

        add_settings_section(
            'palmo_bookings_main',
            __( 'API-Konfiguration', 'palmo-bookings' ),
            function() {
                echo '<p>' . esc_html__( 'Konfigurieren Sie die Verbindung zum PALMO-TRANS Backend-Server.', 'palmo-bookings' ) . '</p>';
            },
            'palmo-bookings-settings'
        );

        add_settings_field(
            'palmo_bookings_api_url',
            __( 'Backend API URL', 'palmo-bookings' ),
            [ __CLASS__, 'render_api_url_field' ],
            'palmo-bookings-settings',
            'palmo_bookings_main'
        );
    }

    public static function render_api_url_field(): void {
        $value = get_option( 'palmo_bookings_api_url', PALMO_BOOKINGS_DEFAULT_API );
        printf(
            '<input type="url" name="palmo_bookings_api_url" value="%s" class="regular-text" placeholder="http://localhost:5000" />',
            esc_attr( $value )
        );
        echo '<p class="description">' . esc_html__( 'URL des PALMO-TRANS Backend-Servers (ohne Schrägstrich am Ende)', 'palmo-bookings' ) . '</p>';
        echo '<p class="description"><code>Lokal: http://localhost:5000</code> &nbsp;|&nbsp; <code>Produktion: https://api.palmo-trans.com</code></p>';
    }

    public static function render(): void {
        echo '<div class="wrap palmo-wrap">';
        echo '<h1><span class="dashicons dashicons-admin-settings"></span> ' . esc_html__( 'PALMO-TRANS Buchungen — Einstellungen', 'palmo-bookings' ) . '</h1>';

        // Connection test
        $conn = Palmo_API_Client::test_connection();

        echo '<div style="margin:20px 0;padding:16px 20px;border-radius:8px;border:1px solid ' . ( $conn['connected'] ? '#28a745' : '#d9534f' ) . ';background:' . ( $conn['connected'] ? '#d4edda' : '#f8d7da' ) . ';">';
        if ( $conn['connected'] ) {
            echo '<strong style="color:#28a745;">✅ Verbindung erfolgreich!</strong>';
            echo '<br>Server Status: ' . esc_html( $conn['status'] ?? 'OK' );
            if ( ! empty( $conn['timestamp'] ) ) {
                echo ' | Server-Zeit: ' . esc_html( $conn['timestamp'] );
            }
        } else {
            echo '<strong style="color:#d9534f;">❌ Verbindung fehlgeschlagen!</strong>';
            echo '<br>Fehler: ' . esc_html( $conn['error'] ?? 'Unbekannter Fehler' );
            echo '<br><br><em>Stellen Sie sicher, dass der Backend-Server läuft:</em>';
            echo '<br><code>cd palmo-trans-calculator-backend && npm run dev</code>';
        }
        echo '</div>';

        echo '<form method="post" action="options.php">';
        settings_fields( 'palmo_bookings_settings' );
        do_settings_sections( 'palmo-bookings-settings' );
        submit_button( __( 'Einstellungen speichern', 'palmo-bookings' ) );
        echo '</form>';

        // API endpoints info
        echo '<h2>' . esc_html__( 'Verfügbare API-Endpunkte', 'palmo-bookings' ) . '</h2>';
        $api_url = esc_html( get_option( 'palmo_bookings_api_url', PALMO_BOOKINGS_DEFAULT_API ) );
        echo '<table class="widefat striped" style="max-width:700px;">';
        echo '<thead><tr><th>Method</th><th>Endpoint</th><th>Beschreibung</th></tr></thead>';
        echo '<tbody>';
        $endpoints = [
            [ 'GET',  '/health',                'Health Check' ],
            [ 'POST', '/api/v2/booking',         'Buchung erstellen' ],
            [ 'GET',  '/api/v2/booking/:number', 'Buchung abrufen' ],
            [ 'GET',  '/api/v2/bookings',        'Alle Buchungen' ],
            [ 'GET',  '/api/v2/bookings/stats',  'Statistiken' ],
            [ 'POST', '/api/v2/quick-quote',     'Schnellkalkulation' ],
            [ 'POST', '/api/v2/calculate',       'Volle Preisberechnung' ],
            [ 'GET',  '/api/v2/vehicles',        'Fahrzeugliste' ],
        ];
        foreach ( $endpoints as $ep ) {
            printf(
                '<tr><td><code>%s</code></td><td><code>%s%s</code></td><td>%s</td></tr>',
                esc_html( $ep[0] ),
                $api_url,
                esc_html( $ep[1] ),
                esc_html( $ep[2] )
            );
        }
        echo '</tbody></table>';

        echo '</div>';
    }
}
