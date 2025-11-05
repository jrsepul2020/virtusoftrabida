<?php
/**
 * Plugin Name: WooCommerce - Nombres de Participantes
 * Plugin URI: https://github.com/jrsepul2020/virtusoftrabida
 * Description: Solicita nombre y apellidos de adultos y menores en el checkout según las variaciones seleccionadas
 * Version: 1.0.0
 * Author: VirtusoFtrabida
 * Author URI: https://github.com/jrsepul2020
 * Text Domain: wc-participant-names
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * WC requires at least: 8.0
 * WC tested up to: 8.5
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevenir acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes del plugin
define('WC_PARTICIPANT_NAMES_VERSION', '1.0.0');
define('WC_PARTICIPANT_NAMES_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WC_PARTICIPANT_NAMES_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WC_PARTICIPANT_NAMES_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Clase principal del plugin
 */
class WC_Participant_Names {
    
    /**
     * Instancia única del plugin
     */
    private static $instance = null;
    
    /**
     * Obtener instancia del plugin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Verificar si WooCommerce está activo
        add_action('plugins_loaded', array($this, 'init'));
    }
    
    /**
     * Inicializar el plugin
     */
    public function init() {
        // Verificar dependencias
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return;
        }
        
        // Cargar traducciones
        load_plugin_textdomain('wc-participant-names', false, dirname(WC_PARTICIPANT_NAMES_PLUGIN_BASENAME) . '/languages');
        
        // Incluir archivos necesarios
        $this->include_files();
        
        // Inicializar componentes
        $this->init_components();
        
        // Cargar assets
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
    }
    
    /**
     * Incluir archivos del plugin
     */
    private function include_files() {
        require_once WC_PARTICIPANT_NAMES_PLUGIN_DIR . 'includes/class-checkout-fields.php';
        require_once WC_PARTICIPANT_NAMES_PLUGIN_DIR . 'includes/class-order-meta.php';
        require_once WC_PARTICIPANT_NAMES_PLUGIN_DIR . 'includes/class-email-integration.php';
    }
    
    /**
     * Inicializar componentes del plugin
     */
    private function init_components() {
        new WC_Participant_Checkout_Fields();
        new WC_Participant_Order_Meta();
        new WC_Participant_Email_Integration();
    }
    
    /**
     * Cargar scripts y estilos
     */
    public function enqueue_scripts() {
        if (is_checkout()) {
            // CSS
            wp_enqueue_style(
                'wc-participant-names',
                WC_PARTICIPANT_NAMES_PLUGIN_URL . 'assets/css/frontend.css',
                array(),
                WC_PARTICIPANT_NAMES_VERSION
            );
            
            // JavaScript
            wp_enqueue_script(
                'wc-participant-names',
                WC_PARTICIPANT_NAMES_PLUGIN_URL . 'assets/js/checkout.js',
                array('jquery'),
                WC_PARTICIPANT_NAMES_VERSION,
                true
            );
            
            // Pasar datos a JavaScript
            wp_localize_script('wc-participant-names', 'wcParticipantNames', array(
                'required_field' => __('Este campo es obligatorio', 'wc-participant-names'),
                'min_length' => __('Debe tener al menos 2 caracteres', 'wc-participant-names')
            ));
        }
    }
    
    /**
     * Aviso de WooCommerce no instalado
     */
    public function woocommerce_missing_notice() {
        ?>
        <div class="notice notice-error">
            <p>
                <strong><?php _e('WooCommerce - Nombres de Participantes', 'wc-participant-names'); ?></strong>
                <?php _e('requiere que WooCommerce esté instalado y activado.', 'wc-participant-names'); ?>
            </p>
        </div>
        <?php
    }
}

/**
 * Iniciar el plugin
 */
function wc_participant_names() {
    return WC_Participant_Names::get_instance();
}

// Inicializar
wc_participant_names();
