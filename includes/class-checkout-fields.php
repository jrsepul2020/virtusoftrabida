<?php
/**
 * Gestión de campos en el checkout
 */

if (!defined('ABSPATH')) {
    exit;
}

class WC_Participant_Checkout_Fields {
    
    public function __construct() {
        // Añadir campos al checkout
        add_action('woocommerce_after_checkout_billing_form', array($this, 'add_participant_fields'));
        
        // Validar campos antes de procesar el pedido
        add_action('woocommerce_checkout_process', array($this, 'validate_participant_fields'));
        
        // Guardar datos del pedido
        add_action('woocommerce_checkout_update_order_meta', array($this, 'save_participant_data'));
    }
    
    /**
     * Añadir campos de participantes en el checkout
     */
    public function add_participant_fields($checkout) {
        $cart_items = $this->get_cart_participants();
        
        if (empty($cart_items['adults']) && empty($cart_items['minors'])) {
            return;
        }
        
        echo '<div id="participant_fields" class="participant-fields-wrapper">';
        echo '<h3>' . __('Datos de Participantes', 'wc-participant-names') . '</h3>';
        
        // Campos para adultos
        if (!empty($cart_items['adults'])) {
            $this->render_participant_section('adult', $cart_items['adults'], __('Adultos', 'wc-participant-names'));
        }
        
        // Campos para menores
        if (!empty($cart_items['minors'])) {
            $this->render_participant_section('minor', $cart_items['minors'], __('Menores', 'wc-participant-names'));
        }
        
        echo '</div>';
    }
    
    /**
     * Renderizar sección de participantes
     */
    private function render_participant_section($type, $count, $title) {
        echo '<div class="participant-section participant-section-' . esc_attr($type) . '">';
        echo '<h4>' . esc_html($title) . ' <span class="participant-count">(' . $count . ')</span></h4>';
        
        for ($i = 1; $i <= $count; $i++) {
            $field_id = "participant_{$type}_{$i}";
            
            woocommerce_form_field($field_id, array(
                'type' => 'text',
                'class' => array('form-row-wide', 'participant-name-field'),
                'label' => sprintf(__('Nombre y Apellidos %s #%d', 'wc-participant-names'), $title, $i),
                'placeholder' => __('Introduce nombre completo', 'wc-participant-names'),
                'required' => true,
                'custom_attributes' => array(
                    'data-participant-type' => $type,
                    'data-participant-number' => $i
                )
            ), WC()->checkout->get_value($field_id));
        }
        
        echo '</div>';
    }
    
    /**
     * Obtener cantidad de participantes del carrito
     */
    private function get_cart_participants() {
        $adults = 0;
        $minors = 0;
        
        foreach (WC()->cart->get_cart() as $cart_item) {
            $product = $cart_item['data'];
            $quantity = $cart_item['quantity'];
            
            // Verificar si es un producto variable
            if ($product->is_type('variation')) {
                $variation_id = $product->get_id();
                $participant_type = $this->get_participant_type($product, $variation_id);
                
                if ($participant_type === 'adult') {
                    $adults += $quantity;
                } elseif ($participant_type === 'minor') {
                    $minors += $quantity;
                }
            }
        }
        
        return array(
            'adults' => $adults,
            'minors' => $minors
        );
    }
    
    /**
     * Determinar si una variación es adulto o menor
     */
    private function get_participant_type($product, $variation_id) {
        // Método 1: Verificar por nombre de variación
        $variation_name = strtolower($product->get_name());
        
        $adult_keywords = array('adulto', 'adult', 'mayor');
        $minor_keywords = array('menor', 'niño', 'niña', 'child', 'kid', 'infantil');
        
        foreach ($adult_keywords as $keyword) {
            if (strpos($variation_name, $keyword) !== false) {
                return 'adult';
            }
        }
        
        foreach ($minor_keywords as $keyword) {
            if (strpos($variation_name, $keyword) !== false) {
                return 'minor';
            }
        }
        
        // Método 2: Verificar campos ACF
        if (function_exists('get_field')) {
            $parent_id = $product->get_parent_id();
            $precio_adulto = get_field('precio_adulto', $parent_id);
            $precio_menores = get_field('precio_menores', $parent_id);
            
            // Comparar con el precio de la variación
            $variation_price = $product->get_price();
            
            if ($precio_adulto && abs($variation_price - $precio_adulto) < 0.01) {
                return 'adult';
            }
            
            if ($precio_menores && abs($variation_price - $precio_menores) < 0.01) {
                return 'minor';
            }
        }
        
        // Método 3: Verificar atributos de la variación
        $attributes = $product->get_attributes();
        foreach ($attributes as $attribute_name => $attribute_value) {
            $attribute_value_lower = strtolower($attribute_value);
            
            if (in_array($attribute_value_lower, $adult_keywords)) {
                return 'adult';
            }
            
            if (in_array($attribute_value_lower, $minor_keywords)) {
                return 'minor';
            }
        }
        
        return null;
    }
    
    /**
     * Validar campos de participantes
     */
    public function validate_participant_fields() {
        $cart_items = $this->get_cart_participants();
        
        // Validar adultos
        if (!empty($cart_items['adults'])) {
            for ($i = 1; $i <= $cart_items['adults']; $i++) {
                $field_id = "participant_adult_{$i}";
                if (empty($_POST[$field_id])) {
                    wc_add_notice(
                        sprintf(__('Por favor, introduce el nombre del adulto #%d', 'wc-participant-names'), $i),
                        'error'
                    );
                } elseif (strlen(trim($_POST[$field_id])) < 2) {
                    wc_add_notice(
                        sprintf(__('El nombre del adulto #%d debe tener al menos 2 caracteres', 'wc-participant-names'), $i),
                        'error'
                    );
                }
            }
        }
        
        // Validar menores
        if (!empty($cart_items['minors'])) {
            for ($i = 1; $i <= $cart_items['minors']; $i++) {
                $field_id = "participant_minor_{$i}";
                if (empty($_POST[$field_id])) {
                    wc_add_notice(
                        sprintf(__('Por favor, introduce el nombre del menor #%d', 'wc-participant-names'), $i),
                        'error'
                    );
                } elseif (strlen(trim($_POST[$field_id])) < 2) {
                    wc_add_notice(
                        sprintf(__('El nombre del menor #%d debe tener al menos 2 caracteres', 'wc-participant-names'), $i),
                        'error'
                    );
                }
            }
        }
    }
    
    /**
     * Guardar datos de participantes en el pedido
     */
    public function save_participant_data($order_id) {
        $cart_items = $this->get_cart_participants();
        
        $adults_data = array();
        $minors_data = array();
        
        // Guardar adultos
        if (!empty($cart_items['adults'])) {
            for ($i = 1; $i <= $cart_items['adults']; $i++) {
                $field_id = "participant_adult_{$i}";
                if (!empty($_POST[$field_id])) {
                    $adults_data[] = $this->sanitize_participant_name($_POST[$field_id]);
                }
            }
        }
        
        // Guardar menores
        if (!empty($cart_items['minors'])) {
            for ($i = 1; $i <= $cart_items['minors']; $i++) {
                $field_id = "participant_minor_{$i}";
                if (!empty($_POST[$field_id])) {
                    $minors_data[] = $this->sanitize_participant_name($_POST[$field_id]);
                }
            }
        }
        
        // Guardar en metadatos del pedido
        if (!empty($adults_data)) {
            update_post_meta($order_id, '_participant_adults', $adults_data);
        }
        
        if (!empty($minors_data)) {
            update_post_meta($order_id, '_participant_minors', $minors_data);
        }
    }
    
    /**
     * Limpiar y formatear nombre de participante
     */
    private function sanitize_participant_name($name) {
        // Limpiar espacios extras
        $name = trim($name);
        $name = preg_replace('/\s+/', ' ', $name);
        
        // Capitalizar correctamente
        $name = mb_convert_case($name, MB_CASE_TITLE, 'UTF-8');
        
        return sanitize_text_field($name);
    }
}