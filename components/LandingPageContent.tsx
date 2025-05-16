import { NewsletterSignup } from './NewsletterSignup'

export function LandingPageContent() {
  return (
    <div className="p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6">Freelance Work is For A Fee - Not Free!</h1>
      <h2 className="text-2xl font-semibold mb-4">Welcome to SmarTrust – The Future of Secure Transactions</h2>
      <p className="mb-4">In today's interconnected world, trust is the cornerstone of successful business relationships. SmarTrust revolutionizes the way buyers and sellers engage by offering a secure, automated three-party escrow solution. Designed for freelancers, entrepreneurs, and businesses of all sizes, SmarTrust ensures your transactions are protected every step of the way.</p>

      <h3 className="text-xl font-semibold mb-2">Why SmarTrust?</h3>
      <h4 className="text-lg font-medium mb-2">A Trustworthy Escrow Service</h4>
      <p className="mb-4">Whether you're a freelance web developer, an online entrepreneur, or a business seeking secure payments, SmarTrust provides a robust platform for seamless, worry-free transactions. With built-in KYC (Know Your Customer) protocols, both buyers and sellers can be confident in the credibility of their counterparts.</p>

      <h4 className="text-lg font-medium mb-2">Streamlined Dispute Resolution</h4>
      <p className="mb-4">Disputes are inevitable, but with SmarTrust, they don't have to be a headache. Our efficient resolution mechanisms leverage AI-driven insights and experienced legal professionals to ensure fairness without costly delays.</p>

      <h4 className="text-lg font-medium mb-2">Blockchain-Powered Transparency</h4>
      <p className="mb-4">Leveraging secure, blockchain-based infrastructure, SmarTrust offers unmatched transparency, speed, and efficiency. Enjoy the benefits of smart contracts without the complexity.</p>

      <h3 className="text-xl font-semibold mb-2">How It Works</h3>
      <ol className="list-decimal list-inside mb-4">
        <li>Connect & Verify: Buyers and sellers connect on the platform, complete their KYC checks, and establish trust with verified identity.</li>
        <li>Define the Deal: Negotiate terms, outline project deliverables, and finalize agreements with intuitive tools and templates.</li>
        <li>Secure Payments: Buyers deposit payments into escrow, ensuring funds are safe and accessible only when milestones are met.</li>
        <li>Deliver & Approve: Sellers deliver the service or product, and buyers release funds upon approval.</li>
        <li>Resolve Disputes: In case of disagreements, SmarTrust's AI and professional adjudicators step in to provide equitable resolutions.</li>
      </ol>

      <h3 className="text-xl font-semibold mb-2">Key Benefits</h3>
      <h4 className="text-lg font-medium mb-2">For Buyers</h4>
      <ul className="list-disc list-inside mb-2">
        <li>Secure funds until obligations are met.</li>
        <li>Build confidence with verified service providers.</li>
        <li>Access efficient dispute resolution when needed.</li>
      </ul>

      <h4 className="text-lg font-medium mb-2">For Sellers</h4>
      <ul className="list-disc list-inside mb-2">
        <li>Assurance of payment for work completed.</li>
        <li>Reduced risk of fraud or non-payment.</li>
        <li>Structured, transparent transactions.</li>
      </ul>

      <h4 className="text-lg font-medium mb-2">For Both Parties</h4>
      <ul className="list-disc list-inside mb-4">
        <li>Flexible payment models, including crypto and fiat.</li>
        <li>Enhanced trust and reduced financial risk.</li>
        <li>A streamlined process tailored for modern digital needs.</li>
      </ul>

      <h3 className="text-xl font-semibold mb-2">SmarTrust in Action</h3>
      <p className="mb-4">Imagine this: John, a freelance developer, agrees to build a website for Mary, a small business owner. Through SmarTrust the following is possible:</p>
      <ul className="list-disc list-inside mb-4">
        <li>AI helps Mary and John to structure the Freelance agreement properly, removing risks of misunderstanding.</li>
        <li>Mary securely deposits payment into escrow, assured that John can't scam her and run away with the deposit.</li>
        <li>John begins work with confidence that funds will be available upon completion.</li>
        <li>Mary reviews the final product, and funds are released automatically.</li>
        <li>Any disputes? SmarTrust's AI and adjudication tools ensure a fair resolution.</li>
      </ul>

      <h3 className="text-xl font-semibold mb-2">Flexible Plans for Everyone</h3>
      <ul className="list-disc list-inside mb-4">
        <li>Free Plan: Get started with one free agreement per month.</li>
        <li>Pay-as-You-Go: Secure transactions with a small fee per contract.</li>
        <li>Pro Plans: Perfect for frequent users with discounts on platform fees.</li>
      </ul>

      <h3 className="text-xl font-semibold mb-2">SmarTrust Partners with Your Favorite Platforms</h3>
      <p className="mb-4">From TaskRabbit to Etsy, SmarTrust integrates effortlessly with existing marketplaces, enhancing their value with secure escrow solutions. Our partnerships provide users with peace of mind without leaving their preferred platforms.</p>

      <h3 className="text-xl font-semibold mb-4">Join SmarTrust And Get Early Access</h3>
      <p className="mb-4">Want to get notified when we go live? Get early access to a safer, more transparent way to do business. Whether you're a freelancer, a buyer, or a platform looking to enhance transaction security, SmarTrust is your partner in creating trustworthy connections.</p>

      <NewsletterSignup />
    </div>
  )
}
