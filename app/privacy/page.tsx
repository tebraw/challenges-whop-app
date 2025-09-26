export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="mb-4">
            Growth ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our challenge management application on the Whop platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <h3 className="text-lg font-medium mb-2">Information from Whop:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>User ID and authentication tokens</li>
            <li>Company/Experience membership information</li>
            <li>Profile information (name, email) as provided by Whop</li>
            <li>Purchase and subscription information</li>
          </ul>
          
          <h3 className="text-lg font-medium mb-2">Information You Provide:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Challenge participation data (check-ins, photos, progress)</li>
            <li>Challenge creation and management data</li>
            <li>Communication and interaction data within challenges</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>To provide and operate the Growth challenge management service</li>
            <li>To authenticate and authorize your access through Whop</li>
            <li>To track challenge progress and participation</li>
            <li>To process payments and manage subscriptions through Whop</li>
            <li>To send notifications about challenge activities</li>
            <li>To improve our services and user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
          <p className="mb-4">We do not sell your personal information. We may share information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>With Whop as required for platform integration and authentication</li>
            <li>Within your company/experience community for challenge participation</li>
            <li>With challenge organizers and participants as necessary for challenge functionality</li>
            <li>When required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. Your data is stored securely and transmitted using encryption.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
          <p className="mb-4">
            We retain your information for as long as necessary to provide our services and as required by law. Challenge data may be retained for the duration of challenges and reasonable periods thereafter for legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
          <p className="mb-4">Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your information</li>
            <li>Restrict processing of your information</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
          <p className="mb-4">
            Our app integrates with Whop's platform and services. Please review Whop's Privacy Policy for information about how they handle your data. We are not responsible for the privacy practices of third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify users of any material changes through the app or by email.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p className="mb-4">
            Email: support@growth-challenges.com<br />
            Through the Whop platform messaging system
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Whop Platform Integration</h2>
          <p className="mb-4">
            Growth operates as an application on the Whop platform. Your use of Growth is also subject to Whop's Terms of Service and Privacy Policy. We comply with Whop's Developer API Terms and requirements for user data protection.
          </p>
        </section>
      </div>
    </div>
  );
}