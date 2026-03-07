<?php
/**
 * Plugin Name: PALMO-TRANS Buchungen
 * Plugin URI:  https://palmo-trans.com
 * Description: Admin panel do zarządzania zamówieniami z kalkulatora PALMO-TRANS v2. Pobiera bookings z REST API backendu.
 * Version:     1.0.0
 * Author:      PB-MEDIA
 * Author URI:  https://pb-media.pl
 * Text Domain: palmo-bookings
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 *
 * @package PALMO_Bookings
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ─── Constants ───────────────────────────────────────────────
define( 'PALMO_BOOKINGS_VERSION', '1.0.0' );
define( 'PALMO_BOOKINGS_FILE', __FILE__ );
define( 'PALMO_BOOKINGS_DIR', plugin_dir_path( __FILE__ ) );
define( 'PALMO_BOOKINGS_URL', plugin_dir_url( __FILE__ ) );

// Default API URL — zmień w Settings > PALMO-TRANS Buchungen
define( 'PALMO_BOOKINGS_DEFAULT_API', 'http://localhost:5000' );

// ─── Autoload ────────────────────────────────────────────────
require_once PALMO_BOOKINGS_DIR . 'includes/class-palmo-api-client.php';
require_once PALMO_BOOKINGS_DIR . 'includes/class-palmo-bookings-table.php';
require_once PALMO_BOOKINGS_DIR . 'includes/class-palmo-admin-pages.php';
require_once PALMO_BOOKINGS_DIR . 'includes/class-palmo-dashboard-widget.php';
require_once PALMO_BOOKINGS_DIR . 'includes/class-palmo-settings.php';

// ─── Init ────────────────────────────────────────────────────
add_action( 'plugins_loaded', function() {
    Palmo_Admin_Pages::init();
    Palmo_Dashboard_Widget::init();
    Palmo_Settings::init();
});

// ─── Activation ──────────────────────────────────────────────
register_activation_hook( __FILE__, function() {
    // Domyślne ustawienia
    if ( ! get_option( 'palmo_bookings_api_url' ) ) {
        update_option( 'palmo_bookings_api_url', PALMO_BOOKINGS_DEFAULT_API );
    }
});
