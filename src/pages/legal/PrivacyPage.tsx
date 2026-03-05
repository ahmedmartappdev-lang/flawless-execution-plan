import React from "react";
import CustomerLayout from "@/components/layouts/CustomerLayout";

const PrivacyPage = () => {
  return (
    <CustomerLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-primary">Privacy Policy</h1>
        
        <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
          <p>
            Thank you for using the Ahmad Mart Application. We provide the best standards in our 
            customer’s information privacy and high security, in relation to their secure transactions 
            on the Ahmad Mart Website and Mobile Application.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Consent</h2>
            <p>
              By accessing the website/app you agree to be bound by the terms and conditions of this 
              Privacy Policy and consent to the collection, storage, and use of information relating 
              to you as provided herein. If you do not agree with the terms and conditions, please do 
              not use or access the website/app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Use of Information</h2>
            <p>
              The Company respects your privacy and values the trust you place in it. The collected 
              information is used to provide the services you request, resolve disputes, troubleshoot 
              problems, help promote a safe service, collect money, measure consumer interest in our 
              products and services, inform you about online and offline offers, products, services, 
              and updates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Updates to Policy</h2>
            <p>
              We reserve the right to update, change or replace any part of these Terms of Service by 
              posting updates and/or changes to our website. It is your responsibility to check this 
              page periodically for changes.
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              For privacy-related questions, contact us at <a href="mailto:support@ahmadenterprises.in" className="text-blue-600">support@ahmadenterprises.in</a>
            </p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default PrivacyPage;
