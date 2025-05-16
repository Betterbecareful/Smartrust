'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
  {
    question: "What is SmarTrust?",
    answer: "SmarTrust is a secure, automated three-party escrow solution designed for freelancers, entrepreneurs, and businesses of all sizes. It ensures that transactions are protected and provides a platform for seamless, worry-free business interactions."
  },
  {
    question: "How does SmarTrust work?",
    answer: "SmarTrust works by connecting buyers and sellers, facilitating KYC checks, allowing users to define deal terms, securing payments in escrow, and providing a platform for service delivery and approval. If disputes arise, SmarTrust's AI and professional adjudicators step in to provide equitable resolutions."
  },
  {
    question: "What are the benefits of using SmarTrust for buyers?",
    answer: "Buyers benefit from SmarTrust by having their funds secured until obligations are met, building confidence with verified service providers, and accessing efficient dispute resolution when needed."
  },
  {
    question: "What are the advantages for sellers using SmarTrust?",
    answer: "Sellers using SmarTrust enjoy assurance of payment for work completed, reduced risk of fraud or non-payment, and structured, transparent transactions."
  },
  {
    question: "Is SmarTrust blockchain-based?",
    answer: "Yes, SmarTrust leverages secure, blockchain-based infrastructure to offer unmatched transparency, speed, and efficiency. This allows users to enjoy the benefits of smart contracts without dealing with their complexity."
  },
  {
    question: "How does SmarTrust handle disputes?",
    answer: "SmarTrust uses a combination of AI-driven insights and experienced legal professionals to ensure fair and efficient dispute resolution without costly delays."
  },
  {
    question: "What types of payment does SmarTrust support?",
    answer: "SmarTrust supports flexible payment models, including both cryptocurrency and fiat currency options."
  },
  {
    question: "Is there a free plan available?",
    answer: "Yes, SmarTrust offers a free plan that allows users to create one free agreement per month."
  },
  {
    question: "Can SmarTrust integrate with other platforms?",
    answer: "Yes, SmarTrust is designed to integrate effortlessly with existing marketplaces, from TaskRabbit to Etsy, enhancing their value with secure escrow solutions."
  },
  {
    question: "How does SmarTrust ensure the credibility of users?",
    answer: "SmarTrust implements built-in KYC (Know Your Customer) protocols, allowing both buyers and sellers to be confident in the credibility of their counterparts."
  },
  {
    question: "What happens after a contract is generated?",
    answer: "After a contract is generated, users can review it, make edits if necessary, and then proceed with the agreement. The funds are held in escrow until the agreed-upon conditions are met."
  },
  {
    question: "Is my personal information safe with SmarTrust?",
    answer: "Yes, SmarTrust takes data security seriously. We use advanced encryption and security measures to protect your personal and financial information."
  },
  {
    question: "Can I use SmarTrust for international transactions?",
    answer: "Yes, SmarTrust is designed to facilitate both domestic and international transactions, making it ideal for global freelancers and businesses."
  },
  {
    question: "How quickly are funds released after project completion?",
    answer: "Once the buyer approves the completed work, funds are typically released immediately. However, the exact timing may depend on the specific terms agreed upon in the contract."
  }
]

export default function FAQPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl py-8">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
