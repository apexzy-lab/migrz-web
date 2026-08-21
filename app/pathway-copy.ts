export type PathwayCopy = {
  overview: string[];
  eligibility: string[];
  evidence: string[];
  preparation: string[];
  cautions: string[];
};

export const pathwayCopy: Record<string, PathwayCopy> = {
  "us/eb-1a": {
    overview: [
      "EB-1A is designed for people who have reached the upper levels of their field and can prove sustained national or international recognition. It is not limited to academics or celebrities: founders, technology leaders, executives, researchers, physicians, artists, and other professionals may qualify when their record satisfies the legal standard.",
      "The classification permits self-petitioning, so a permanent job offer and labor certification are not required. That flexibility does not make the evidentiary standard easier. USCIS first considers whether the evidence meets the regulatory criteria and then evaluates the record as a whole to decide whether the applicant has demonstrated extraordinary ability and continued work in the area of expertise.",
    ],
    eligibility: ["A one-time major internationally recognized award, or qualifying evidence under at least three regulatory criteria", "Sustained acclaim rather than one isolated achievement", "Recognition showing that the applicant is among the small percentage at the top of the field", "A plan to continue working in the area of extraordinary ability in the United States"],
    evidence: ["Independent media coverage and profiles", "Awards with evidence of reputation and selection standards", "Judging, peer review, advisory, or selection responsibilities", "Original technical, scientific, commercial, or cultural contributions with documented significance", "Leading or critical roles for distinguished organizations", "Authorship, high remuneration, selective memberships, or comparable evidence appropriate to the field"],
    preparation: ["Define the field and the strongest case theory", "Map every available exhibit to the regulatory criteria", "Collect independent proof of significance, not only recommendation letters", "Build a coherent final-merits narrative connecting recognition, impact, and future work"],
    cautions: ["Meeting three criteria does not automatically establish eligibility", "Job titles and seniority are not substitutes for independent recognition", "Recommendation letters are strongest when supported by objective exhibits", "Processing options and government fees should be confirmed immediately before filing"],
  },
  "us/niw": {
    overview: [
      "The National Interest Waiver is an EB-2 strategy for applicants whose proposed work offers meaningful value to the United States. The applicant must first qualify for EB-2 as an advanced-degree professional or a person of exceptional ability, and then show why waiving the usual job-offer and labor-certification requirements is justified.",
      "A persuasive NIW case is future-facing. Past accomplishments establish credibility, but the central argument explains the proposed endeavor, why it has substantial merit and national importance, why the applicant is well positioned to advance it, and why the United States benefits from allowing the work to proceed without the ordinary labor-certification process.",
    ],
    eligibility: ["Qualification for the underlying EB-2 classification", "A clearly defined proposed endeavor with substantial merit and national importance", "A record showing the applicant is well positioned to advance that endeavor", "Facts supporting the conclusion that waiving the job offer and labor certification is beneficial on balance"],
    evidence: ["Advanced education, licenses, specialized expertise, and a progressive work record", "Products, research, programs, ventures, patents, publications, or public-interest initiatives", "Independent adoption, funding, revenue, implementation, citations, or measurable outcomes", "Detailed future plans, stakeholder interest, contracts, grants, or letters showing demand", "Evidence connecting the endeavor to a wider US priority, industry, region, population, or economic interest"],
    preparation: ["Separate the proposed endeavor from a generic occupation or job description", "Document both past execution and realistic forward plans", "Identify independent evidence of scale, importance, and demand", "Integrate the EB-2 threshold and the three NIW prongs into one consistent record"],
    cautions: ["A socially useful profession alone does not establish national importance", "The case should explain prospective impact rather than rely only on credentials", "Entrepreneurial cases require credible execution and market evidence", "A waiver does not remove the need to satisfy the underlying EB-2 requirements"],
  },
  "uk/global-talent-visa": {
    overview: [
      "The UK Global Talent route is for leaders and potential leaders in academia or research, arts and culture, and digital technology. It offers greater employment flexibility than an employer-sponsored route because the permission is attached to the applicant's recognized talent or promise rather than one sponsoring company.",
      "Most applicants first seek endorsement under the criteria for their field and career stage. Winners of specifically listed prestigious prizes can apply directly without endorsement. The evidence must therefore be built for the correct endorsing pathway: a strong technology record is evaluated differently from an academic appointment, research fellowship, film career, or arts portfolio.",
    ],
    eligibility: ["Applicant is at least 18 and works in an eligible field", "Recognition as a leader or potential leader under the relevant endorsing criteria", "An endorsement from the appropriate body unless a listed prestigious-prize exemption applies", "Documents and immigration history satisfying the visa-stage requirements"],
    evidence: ["Leadership, innovation, product, research, commercial, or cultural impact", "Independent recognition from respected organizations and experts", "Awards, press, publications, exhibitions, performances, patents, or investment evidence", "Recommendation letters tailored to the endorsing body", "A portfolio showing sustained contribution rather than disconnected achievements"],
    preparation: ["Select the precise field, endorsing body, and talent or promise route", "Audit mandatory and optional criteria before choosing exhibits", "Build a limited, high-quality evidence portfolio within the applicable rules", "Prepare endorsement and visa-stage documents as distinct but coordinated submissions"],
    cautions: ["Not every professional working in technology or research falls within the route", "Endorsing bodies apply field-specific definitions and document limits", "Settlement may be available after different periods depending on field and route", "Current fees, processing times, and healthcare surcharge should be checked on GOV.UK"],
  },
  "uk/innovator-founder-visa": {
    overview: [
      "The Innovator Founder visa is for entrepreneurs who want to establish and actively run an innovative business in the United Kingdom. The business or business idea must be assessed by an approved endorsing body, and the founder must remain actively involved rather than acting as a passive investor.",
      "Endorsement turns on more than an attractive pitch deck. The proposition must be genuinely innovative, commercially viable, and capable of scalable growth. The founder's experience, access to resources, research, financial assumptions, route to market, job-creation potential, and ability to execute must support the same credible business story.",
    ],
    eligibility: ["A new and genuinely innovative UK business proposition", "Endorsement by an approved endorsing body", "A viable plan supported by the founder's capability and available resources", "Scalability planning, including credible potential for job creation and national or international growth", "English-language and other immigration requirements"],
    evidence: ["Market research and a defensible explanation of differentiation", "Founder experience, domain expertise, prototypes, customers, pilots, or traction", "Financial forecasts tied to realistic assumptions", "Product roadmap, operating model, intellectual property, and risk analysis", "Hiring, geographic expansion, and international growth plans"],
    preparation: ["Stress-test the idea against the innovation, viability, and scalability tests", "Choose an endorsing body whose scope fits the proposed business", "Align the business plan, founder profile, financial model, and interview answers", "Prepare for required contact-point reviews after the visa is granted"],
    cautions: ["Joining an already trading business generally does not satisfy the new-business requirement", "Endorsement is a separate commercial and evidentiary process from the visa application", "Progress is monitored and endorsement can be withdrawn", "Settlement after three years requires separate business-performance conditions"],
  },
  "ca/canada-immigration": {
    overview: [
      "Canada does not have one universal skilled-immigration application. Federal programs, Express Entry, provincial and territorial streams, regional programs, family options, and temporary-to-permanent pathways each use different eligibility rules and selection priorities.",
      "A useful Canadian strategy begins with comparison. Language scores, age, education, skilled work history, Canadian experience, occupation, provincial ties, French ability, job offers, settlement funds, and the timing of invitation rounds can all change which route is realistic. A profile that is weak in one system may be competitive in another.",
    ],
    eligibility: ["Eligibility for at least one federal, provincial, territorial, or regional program", "Admissibility and complete civil, police, medical, and identity documentation", "Verified language, education, and work-history evidence where required", "A credible intention to live in the destination connected to the selected program"],
    evidence: ["Approved language-test results", "Educational credential assessments when required", "Detailed employer reference letters and proof of qualifying work", "Settlement-funds and family documentation", "Provincial ties, job offers, licences, or occupation evidence relevant to a selected stream"],
    preparation: ["Build a full eligibility and CRS baseline", "Compare federal and provincial routes before creating profiles", "Correct work-history classification and documentary gaps", "Monitor official invitation and stream updates while keeping evidence ready"],
    cautions: ["Entering an Express Entry pool does not guarantee an invitation", "Provincial streams can open, pause, or change criteria", "A nomination carries a genuine intention-to-reside obligation", "Only current federal and provincial government instructions should be used for filing"],
  },
  "ca/express-entry": {
    overview: [
      "Express Entry is the online system used by Immigration, Refugees and Citizenship Canada to manage skilled-worker applications under the Canadian Experience Class, Federal Skilled Worker Program, and Federal Skilled Trades Program. Eligible candidates enter a pool and receive a Comprehensive Ranking System score.",
      "Eligibility and competitiveness are different questions. A person may qualify to enter the pool but still need a higher score or selection under a category-based, program-specific, or general invitation round. Strategy therefore includes both accurate profile creation and legitimate improvements to the factors that affect ranking.",
    ],
    eligibility: ["Qualification under at least one Express Entry-managed federal program", "Valid language-test results and education documentation", "Correct classification and proof of skilled work experience", "Settlement funds where the selected program requires them", "A score high enough for an applicable invitation round before a permanent-residence application can be submitted"],
    evidence: ["Language results from an approved test", "Educational credentials and any required assessment", "Employer letters describing dates, hours, duties, compensation, and position", "Passport, police, medical, family, and financial records", "Documents supporting Canadian experience, French ability, provincial nomination, or other claimed points"],
    preparation: ["Confirm program eligibility before estimating the CRS score", "Reconcile dates, occupational classification, and personal history", "Model legitimate score-improvement scenarios", "Prepare permanent-residence evidence before an invitation shortens the timeline"],
    cautions: ["CRS cut-offs and category priorities change between rounds", "Incorrectly claimed points can lead to refusal or misrepresentation findings", "Profiles expire and supporting documents have validity periods", "Use the current IRCC calculator and instructions before submission"],
  },
  "ca/provincial-nominee-program": {
    overview: [
      "The Provincial Nominee Program allows participating provinces and territories to nominate people whose skills, education, work experience, or business background support local economic needs. Each jurisdiction designs its own streams, eligibility criteria, application windows, and annual nomination priorities.",
      "There are Express Entry-linked and non-Express Entry pathways. A qualifying Express Entry nomination adds 600 CRS points, while a base or non-Express Entry nomination proceeds through a separate federal permanent-residence process after the provincial stage.",
    ],
    eligibility: ["Eligibility under the rules of a specific provincial or territorial stream", "Skills, education, work history, job offer, occupation, or connection required by that stream", "A genuine intention to reside in the nominating jurisdiction", "Federal admissibility and permanent-residence requirements after nomination"],
    evidence: ["Employment and occupational documentation", "Job offer and employer evidence where required", "Language and education results", "Past study, work, family, or other provincial connection", "Settlement plan, funds, licensing, and intention-to-reside evidence"],
    preparation: ["Compare jurisdictions and streams using current official criteria", "Verify occupation, licensing, and employer rules", "Prepare documents before short application windows open", "Coordinate provincial and federal profiles so the information remains consistent"],
    cautions: ["Quebec and Nunavut do not operate PNPs", "A province can change priorities or nomination allocations", "Nomination does not remove federal admissibility review", "Applicants should not select a province solely for points without a real intention to live there"],
  },
  "au/australia-global-talent": {
    overview: [
      "Australia's National Innovation visa is an invitation-only permanent visa for exceptionally talented people whose achievements and future contribution are of national value. It replaced the former Global Talent visa in December 2024, so older descriptions of the route should not be used as filing guidance.",
      "The process begins with an expression of interest. Only candidates invited by the Department of Home Affairs can lodge a visa application. International recognition, an exceptional record, the quality of the Australian nominator, and alignment with current national priorities all affect the strength of the invitation case.",
    ],
    eligibility: ["An internationally recognized record of exceptional and outstanding achievement", "Continuing prominence in the applicant's field", "Ability to obtain employment or become independently established in Australia", "Nomination by an eligible Australian citizen, permanent resident, eligible New Zealand citizen, or Australian organization with a national reputation in the field", "An invitation before the visa application is lodged"],
    evidence: ["Major awards, high-impact research, patents, innovation, investment, entrepreneurship, or recognized creative and sporting work", "Independent evidence of international standing and measurable impact", "A credible Australian contribution and establishment plan", "A strong nominator statement supported by the nominator's reputation", "Evidence relevant to current invitation priorities"],
    preparation: ["Assess whether the record is competitive for an invitation, not merely technically eligible", "Define the field and national-value proposition", "Select and brief an appropriate nominator", "Build the expression of interest and preserve a complete visa-stage record"],
    cautions: ["Submitting an expression of interest does not guarantee an invitation", "Invitation priorities and program settings can change", "The old Global Talent program name may appear in legacy content but is no longer the current route", "Only Home Affairs instructions should determine filing requirements"],
  },
  "eu/de/germany-eu-blue-card": {
    overview: [
      "The German EU Blue Card is a residence title for qualified employment. It is designed for professionals whose recognized academic or comparable tertiary qualification is connected to a qualifying job offer in Germany and whose salary meets the threshold applicable at the time of application.",
      "The analysis is practical as well as legal: the qualification must be recognized or comparable, the role must normally match the qualification, the employment contract must meet duration requirements, and the salary threshold can differ for shortage occupations and certain recent graduates or qualifying IT professionals.",
    ],
    eligibility: ["A German, recognized foreign, or comparable higher-education qualification, or another qualifying tertiary credential", "A specific German job offer or employment contract for qualifying work", "Employment that is generally appropriate to the qualification", "Salary meeting the current general or reduced statutory threshold", "Any required professional licence for regulated work"],
    evidence: ["Degree certificates and recognition or comparability records", "Signed employment contract or binding job offer", "Detailed role description, salary, and working conditions", "Professional licence or permission where required", "Civil records, insurance, and residence documentation"],
    preparation: ["Check the qualification in the relevant recognition systems", "Confirm the current salary threshold and occupation category", "Review the contract and role-to-qualification connection", "Plan family, language, relocation, and eventual settlement steps"],
    cautions: ["Salary thresholds are updated and should not be copied from an old article", "Regulated professions may require recognition before employment begins", "Settlement timing depends on continued qualifying employment and language level", "EU mobility rights have conditions and are not automatic freedom of movement"],
  },
  "uae/dubai-golden-visa": {
    overview: [
      "The UAE Golden Visa is a long-term renewable residence framework covering several distinct categories, including investors, entrepreneurs, scientists, exceptional talents, executives, specialists, outstanding students, and graduates. The relevant category determines the nomination route, documents, authority, financial conditions, and residence term.",
      "A Golden Visa strategy should therefore begin with category selection rather than a generic application. An entrepreneur's evidence may focus on an approved project and business value, while a scientist, creative professional, executive, or investor will face a different nominating authority and documentary standard.",
    ],
    eligibility: ["Qualification under a published Golden Visa category", "Approval, nomination, recommendation, investment, professional standing, or academic performance required for that category", "Valid identity, medical, insurance, and residence documentation", "Compliance with the instructions of the relevant federal or emirate authority"],
    evidence: ["Investment and asset records for qualifying investor categories", "Company, funding, project, incubator, or authority evidence for entrepreneurs", "Awards, publications, patents, recognition, employment, salary, or professional-licence records for talents and specialists", "Academic results and institutional documents for students and graduates", "Family and dependent documentation where included"],
    preparation: ["Identify the exact federal or emirate category and authority", "Verify the current financial and nomination rules", "Assemble provenance documents and required attestations", "Coordinate entry, medical, identity, insurance, and family steps after preliminary approval"],
    cautions: ["Dubai and federal application channels may differ by category", "Residence length and conditions are not identical for every applicant", "Property or business value alone may not satisfy all documentary rules", "Thresholds and nomination practices should be confirmed on official UAE portals"],
  },
};
