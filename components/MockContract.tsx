export function generateMockContract(
  role: string,
  name: string,
  partnerName: string,
  location: string,
  input: string
): string {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  if (role === 'Lawyer') {
    return `
# ARBITRATION SERVICES AGREEMENT

## PARTIES

This Agreement is made between ${name} ("Arbitrator") and SmarTrust ("Company").

## LOCATION

The Arbitrator's primary place of business is ${location}.

## SERVICES

The Arbitrator agrees to provide the following services:

${input}

## TERMS AND CONDITIONS

### 1. Scope of Work

a) The Company will send arbitration files to the Arbitrator for review and adjudication.
b) The Arbitrator agrees to review the file summary and either accept or decline the arbitration within 24 hours of receiving the file.
c) If accepted, the Arbitrator commits to reviewing all details of the file, reaching out to involved parties as necessary, and issuing an adjudication within 1-5 days of acceptance.

### 2. Compensation

a) The Arbitrator will be compensated at a rate of [RATE] per arbitration case.
b) Additional compensation for complex cases or extended arbitration periods will be negotiated on a case-by-case basis.

### 3. Confidentiality

The Arbitrator agrees to maintain strict confidentiality regarding all case information and parties involved.

### 4. Independence and Impartiality

The Arbitrator shall remain independent and impartial throughout the arbitration process.

### 5. Termination

Either party may terminate this Agreement with 30 days written notice. The Arbitrator agrees to complete any ongoing arbitrations at the time of termination.

### 6. Liability

The Arbitrator shall not be liable for any decisions made in good faith during the arbitration process.

### 7. Governing Law

This Agreement is governed by the laws of ${location}.

## SIGNATURES

${name}
_______________________
Date: ${currentDate}

SmarTrust Representative
_______________________
Date: ${currentDate}
`;
  } else {
    return `
# ESCROW CONTRACT AGREEMENT

## PARTIES

This Agreement is made between ${role === 'Freelancer' ? name : partnerName} ("Provider") and ${role === 'Buyer' ? name : partnerName} ("Client").

## SERVICES

${input}

## TERMS AND CONDITIONS

### 1. Payment Terms

The Client agrees to pay the Provider for the Services as follows:

a) A deposit of 30% of the total project cost is due upon signing this Agreement.
b) The remaining 70% will be paid upon satisfactory completion of the project.
c) All payments will be held in escrow by SmarTrust until the agreed-upon milestones are met.

### 2. Deliverables

The Provider agrees to deliver the following:

a) [Specific deliverable 1]
b) [Specific deliverable 2]
c) [Specific deliverable 3]

All deliverables will be subject to the Client's review and approval.

### 3. Timeline

The project will be completed according to the following timeline:

a) Project Start Date: [Start Date]
b) Milestone 1 Completion: [Date]
c) Milestone 2 Completion: [Date]
d) Final Delivery: [End Date]

### 4. Intellectual Property

Upon full payment, the Client will own all rights, title, and interest in the deliverables, including all intellectual property rights.

### 5. Confidentiality

Both parties agree to keep confidential any proprietary information disclosed during the course of this project.

### 6. Warranty

The Provider warrants that the deliverables will be of professional quality and free from defects for a period of 30 days after final delivery.

### 7. Limitation of Liability

The Provider's liability under this Agreement shall not exceed the total amount paid by the Client for the Services.

### 8. Termination

Either party may terminate this Agreement with 14 days written notice. In the event of termination, the Client shall pay for all work completed up to the date of termination.

### 9. Dispute Resolution

Any disputes arising from this Agreement shall be resolved through mediation before resorting to arbitration or litigation.

### 10. General Provisions

This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, whether oral or written.

### 11. Governing Law

This contract is governed by the laws of ${location}.

## SIGNATURES

${name}
_______________________
Date: ${currentDate}

${partnerName ? `${partnerName}
_______________________
Date: ${currentDate}` : '[Counterparty Signature]'}
`;
  }
}
