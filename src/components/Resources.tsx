import React from 'react';
import { Leaf, Bot, CreditCard } from 'lucide-react';

export default function Resources() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Recommended Financial Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Acorns */}
          <a
            href="https://acorns.com/share/?shareable_code=5YUBDUY&first_name=Orie"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-green-100 overflow-hidden group"
          >
            <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-green-500 to-green-600 p-6">
              <div className="flex items-center justify-center">
                <Leaf className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                Acorns
              </h3>
              <p className="mt-2 text-gray-600">
                Start investing with spare change using Acorns' Oak card. Automatically invest when you spend, plus earn bonus investments from 15,000+ brands.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-green-600">
                Get Started with Acorns →
              </div>
            </div>
          </a>

          {/* Pionex */}
          <a
            href="https://accounts.pionex.us/en/signup?ref=pHE9YXwa"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-blue-100 overflow-hidden group"
          >
            <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-blue-500 to-blue-600 p-6">
              <div className="flex items-center justify-center">
                <Bot className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Pionex Trading Bots
              </h3>
              <p className="mt-2 text-gray-600">
                Access professional-grade trading bots that work 24/7. Pionex offers automated trading strategies to help maximize your crypto investments.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
                Start Trading with Pionex →
              </div>
            </div>
          </a>

          {/* Upside */}
          <a
            href="https://upside.app.link/ORIE2964"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-purple-100 overflow-hidden group"
          >
            <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-purple-500 to-purple-600 p-6">
              <div className="flex items-center justify-center">
                <CreditCard className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                Upside Cash Back
              </h3>
              <p className="mt-2 text-gray-600">
                Earn cash back on gas, groceries, and restaurants. Use promo code <span className="font-semibold">ORIE2964</span> to get started with bonus rewards.
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-purple-600">
                Start Earning with Upside →
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}