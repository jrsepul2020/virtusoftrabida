<?php
/**
 * Gestión de metadatos del pedido en el admin
 */

if (!defined('ABSPATH')) {
    exit;
}

class WC_Participant_Order_Meta {
    
    public function __construct() {
        // Mostrar participantes en el admin del pedido
        add_action('woocommerce_admin_order_data_after_billing_address', array($this, 'display_participants_in_admin'));
        
        // Añadir columna en lista de pedidos
        add_filter('manage_edit-shop_order_columns', array($this, 'add_participants_column'));
        add_action('manage_shop_order_posts_custom_column', array($this, 'display_participants_column'), 10, 2);
    }
    
    /**
     * Mostrar participantes en el detalle del pedido
     */
    public function display_participants_in_admin($order) {
        $order_id = $order->get_id();
        
        $adults = get_post_meta($order_id, '_participant_adults', true);
        $minors = get_post_meta($order_id, '_participant_minors', true);
        
        if (empty($adults) && empty($minors)) {
            return;
        }
        
        echo '<div class="order-participants-info">';
        echo '<h3>' . __('Participantes', 'wc-participant-names') . '</h3>';
        
        if (!empty($adults)) {
            echo '<h4>' . __('Adultos', 'wc-participant-names') . ' (' . count($adults) . ')</h4>';
            echo '<ol class="participant-list participant-adults">';
            foreach ($adults as $name) {
                echo '<li>' . esc_html($name) . '</li>';
            }
            echo '</ol>';
        }
        
        if (!empty($minors)) {
            echo '<h4>' . __('Menores', 'wc-participant-names') . ' (' . count($minors) . ')</h4>';
            echo '<ol class="participant-list participant-minors">';
            foreach ($minors as $name) {
                echo '<li>' . esc_html($name) . '</li>';
            }
            echo '</ol>';
        }
        
        echo '</div>';
        echo '<style>
            .order-participants-info { margin-top: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
            .order-participants-info h3 { margin-top: 0; color: #333; }
            .order-participants-info h4 { margin-bottom: 10px; color: #666; font-size: 14px; }
            .participant-list { margin: 0 0 15px 20px; padding: 0; }
            .participant-list li { margin-bottom: 5px; }
        </style>';
    }
    
    /**
     * Añadir columna de participantes en lista de pedidos
     */
    public function add_participants_column($columns) {
        $new_columns = array();
        
        foreach ($columns as $key => $column) {
            $new_columns[$key] = $column;
            
            // Insertar después de la columna de estado
            if ($key === 'order_status') {
                $new_columns['participants'] = __('Participantes', 'wc-participant-names');
            }
        }
        
        return $new_columns;
    }
    
    /**
     * Mostrar datos de participantes en la columna
     */
    public function display_participants_column($column, $post_id) {
        if ($column === 'participants') {
            $adults = get_post_meta($post_id, '_participant_adults', true);
            $minors = get_post_meta($post_id, '_participant_minors', true);
            
            $adult_count = is_array($adults) ? count($adults) : 0;
            $minor_count = is_array($minors) ? count($minors) : 0;
            
            if ($adult_count > 0 || $minor_count > 0) {
                $parts = array();
                
                if ($adult_count > 0) {
                    $parts[] = sprintf(
                        _n('%d adulto', '%d adultos', $adult_count, 'wc-participant-names'),
                        $adult_count
                    );
                }
                
                if ($minor_count > 0) {
                    $parts[] = sprintf(
                        _n('%d menor', '%d menores', $minor_count, 'wc-participant-names'),
                        $minor_count
                    );
                }
                
                echo '<small>' . implode(', ', $parts) . '</small>';
            } else {
                echo '—';
            }
        }
    }
}