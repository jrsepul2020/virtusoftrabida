import { useState } from "react";
import PayPalTestLive from "./PayPalTestLive";
import PayPalConfigManager from "./PayPalConfigManager";
import PayPalTransactionsList from "./PayPalTransactionsList";

type TabId = "transactions" | "config" | "test";

interface Tab {
  id: TabId;
  label: string;
  description: string;
}

export default function PayPalDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("transactions");

  const tabs: Tab[] = [
    {
      id: "transactions",
      label: "Listado de Transacciones",
      description: "Transacciones reales sincronizadas desde PayPal",
    },
    {
      id: "config",
      label: "Configuración",
      description: "Configuración de credenciales y parámetros de PayPal",
    },
    {
      id: "test",
      label: "Test PayPal Live",
      description: "Realizar pagos de prueba en modo LIVE",
    },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Header con título principal */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">PAYPAL</h1>
        <p className="text-blue-100 mt-2">
          Gestión completa de pagos, configuración y transacciones de PayPal
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-left transition-all duration-200 border-b-2 ${
                  isActive
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="font-semibold text-base">{tab.label}</div>
                <div
                  className={`text-sm mt-1 ${isActive ? "text-blue-600" : "text-gray-500"}`}
                >
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeTab === "transactions" && <PayPalTransactionsList />}
        {activeTab === "config" && <PayPalConfigManager />}
        {activeTab === "test" && <PayPalTestLive />}
      </div>
    </div>
  );
}
