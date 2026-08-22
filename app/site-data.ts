export const SITE_URL = "https://migrzz.com";
export const ASSESSMENT_URL = "https://forms.migrzz.com/?fluent-form=6";

export type Pathway = {
  slug: string;
  code: string;
  country: string;
  title: string;
  eyebrow: string;
  headline: string;
  summary: string;
  signal: string;
  definition: string;
  frameworkTitle: string;
  framework: string[];
  candidates: string[];
  benefits: string[];
  officialUrl: string;
  officialLabel: string;
  note?: string;
};

export const pathways: Pathway[] = [
  {
    slug: "us/eb-1a", code: "EB-1A", country: "United States", title: "EB-1A Extraordinary Ability",
    eyebrow: "Self-petitioned permanent residency", headline: "Your record can speak for itself.",
    summary: "For professionals with sustained national or international recognition in science, arts, education, business, or athletics.",
    signal: "No employer sponsorship. No lottery. A case built around documented achievement.",
    definition: "EB-1A is a first-preference employment-based immigrant classification. A qualifying applicant may self-petition by showing a major internationally recognized award or evidence meeting at least three regulatory criteria, followed by a review of the record as a whole.",
    frameworkTitle: "Evidence Migrz evaluates", framework: ["Awards and recognized prizes", "Selective memberships", "Published material about your work", "Judging the work of others", "Original contributions of significance", "Scholarly or professional authorship", "Leading or critical roles", "High remuneration", "Commercial success where applicable", "Comparable evidence when a criterion does not readily apply"],
    candidates: ["Technology and product leaders", "Researchers and academics", "Healthcare innovators", "Founders and executives", "Artists, athletes, and creative leaders"],
    benefits: ["Self-petition route", "Permanent-residency classification", "No labor certification", "Premium processing may be available"],
    officialUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-first-preference-eb-1", officialLabel: "USCIS EB-1 guidance"
  },
  {
    slug: "us/niw", code: "NIW", country: "United States", title: "National Interest Waiver",
    eyebrow: "EB-2 national interest strategy", headline: "Make the case for why your work matters.",
    summary: "For advanced-degree professionals and people of exceptional ability whose proposed work has substantial merit and national importance.",
    signal: "The question is not only what you have achieved. It is why the United States benefits from what you will do next.",
    definition: "A National Interest Waiver can remove the job-offer and labor-certification requirements from an eligible EB-2 case. USCIS applies a three-part framework to the proposed endeavor and the applicant's ability to advance it.",
    frameworkTitle: "The three-part framework", framework: ["The proposed endeavor has substantial merit and national importance", "You are well positioned to advance the proposed endeavor", "On balance, waiving the job offer and labor certification benefits the United States"],
    candidates: ["Scientists and researchers", "Public-health professionals", "Technology builders", "Entrepreneurs", "Policy and economic specialists"],
    benefits: ["Potential self-petition", "No labor certification if waived", "Broad range of qualifying endeavors", "Future-focused evidence strategy"],
    officialUrl: "https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-second-preference-eb-2", officialLabel: "USCIS EB-2 guidance"
  },
  {
    slug: "uk/global-talent-visa", code: "GTV", country: "United Kingdom", title: "UK Global Talent Visa",
    eyebrow: "Exceptional talent and promise", headline: "Build your future without tying it to one employer.",
    summary: "A flexible UK route for leaders and potential leaders in academia or research, arts and culture, and digital technology.",
    signal: "A two-part route for most applicants: endorsement first, then the immigration application.",
    definition: "The Global Talent route is for people aged 18 or over who can demonstrate exceptional talent or exceptional promise in an eligible field. Some holders of listed prestigious prizes can apply without endorsement.",
    frameworkTitle: "What the strategy must establish", framework: ["The correct endorsing field and route", "A coherent record of recognition or emerging leadership", "Independent evidence matched to the relevant criteria", "A clear account of the contribution you intend to make in the UK"],
    candidates: ["Digital technology leaders", "Researchers and academics", "Engineers and scientists", "Artists and cultural leaders", "Prize holders in eligible fields"],
    benefits: ["No employer sponsorship for the route", "Flexible work options", "Dependants may apply", "A route to settlement"],
    officialUrl: "https://www.gov.uk/global-talent", officialLabel: "GOV.UK Global Talent guidance"
  },
  {
    slug: "uk/innovator-founder-visa", code: "IFV", country: "United Kingdom", title: "UK Innovator Founder Visa",
    eyebrow: "For experienced founders", headline: "Turn an ambitious business into an endorsed UK plan.",
    summary: "For entrepreneurs building an innovative, viable, and scalable business in the United Kingdom.",
    signal: "The strongest application connects founder credibility, market insight, execution evidence, and a defensible growth plan.",
    definition: "The Innovator Founder route requires endorsement by an approved body. The business concept is considered against innovation, viability, and scalability, alongside the founder's role in building it.",
    frameworkTitle: "The endorsement framework", framework: ["Innovation: a differentiated proposition that meets a market need", "Viability: a credible plan and the capability to deliver it", "Scalability: structured potential for job creation and wider growth", "Founder fit: active leadership and day-to-day responsibility"],
    candidates: ["Experienced founders", "Product and technology entrepreneurs", "Operators commercializing research", "International founders expanding into the UK"],
    benefits: ["Founder-led route", "No fixed statutory minimum investment", "Potential route to settlement", "Family applications available"],
    officialUrl: "https://www.gov.uk/innovator-founder-visa", officialLabel: "GOV.UK Innovator Founder guidance"
  },
  {
    slug: "ca/canada-immigration", code: "CA", country: "Canada", title: "Canada Immigration",
    eyebrow: "Compare the Canadian routes", headline: "A transparent system still needs the right strategy.",
    summary: "Canada offers multiple economic immigration programs. The strongest route depends on your work history, education, language results, location strategy, and timing.",
    signal: "Migrz compares Express Entry, provincial nomination, and other relevant economic routes before recommending a plan.",
    definition: "Canada's permanent-residence system includes federal and provincial programs for skilled workers, graduates, entrepreneurs, and other applicants. Eligibility and selection rules differ by program and can change.",
    frameworkTitle: "What Migrz compares", framework: ["Express Entry eligibility and ranking factors", "Provincial and territorial nomination options", "Language and education evidence", "Work history and occupation alignment", "Regional programs and current invitation patterns"],
    candidates: ["Skilled professionals", "Canadian-experience candidates", "International graduates", "French-speaking applicants", "Applicants aligned with provincial demand"],
    benefits: ["Multiple economic routes", "Published eligibility frameworks", "Family permanent residence", "Provincial and federal options"],
    officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html", officialLabel: "IRCC permanent residence programs"
  },
  {
    slug: "ca/express-entry", code: "EE", country: "Canada", title: "Express Entry",
    eyebrow: "Federal economic immigration", headline: "Know your score. Improve what matters.",
    summary: "Express Entry manages applications for three federal economic programs and ranks eligible candidates in a competitive pool.",
    signal: "A strong plan starts before the profile: eligibility, language, education, work history, and category alignment.",
    definition: "Express Entry is the online system Canada uses to manage applications for the Canadian Experience Class, Federal Skilled Worker Program, and Federal Skilled Trades Program.",
    frameworkTitle: "The profile strategy", framework: ["Confirm eligibility for a managed program", "Document language, education, and skilled work", "Calculate the Comprehensive Ranking System profile", "Identify credible score improvements", "Track category-based and program-specific invitation rounds"],
    candidates: ["Skilled workers with foreign experience", "Professionals with Canadian work experience", "Eligible skilled tradespeople", "Candidates with strong language results"],
    benefits: ["One profile for managed programs", "Transparent ranking factors", "Category-based selection may apply", "PNP can connect to Express Entry"],
    officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html", officialLabel: "IRCC Express Entry guidance"
  },
  {
    slug: "ca/provincial-nominee-program", code: "PNP", country: "Canada", title: "Provincial Nominee Program",
    eyebrow: "Province-led permanent residence", headline: "When one province sees the fit others miss.",
    summary: "Canadian provinces and territories nominate candidates whose skills, education, and experience support their economies.",
    signal: "Each jurisdiction sets its own streams and requirements. Strategy means matching your profile to a real provincial need.",
    definition: "PNP routes can operate through Express Entry or outside it. An Express Entry-linked nomination can add 600 points, while non-Express Entry streams follow a separate permanent-residence process.",
    frameworkTitle: "How Migrz maps the fit", framework: ["Occupation and sector demand", "Provincial connection or job-offer rules", "Express Entry-linked eligibility", "Language and education thresholds", "Application windows and evidence readiness"],
    candidates: ["Professionals in priority occupations", "Applicants with provincial ties", "Candidates with qualifying job offers", "Entrepreneurs in eligible streams"],
    benefits: ["Province-specific opportunities", "Express Entry and non-Express Entry routes", "600 additional CRS points for an accepted EE nomination", "Direct alignment with regional demand"],
    officialUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/provincial-nominees.html", officialLabel: "IRCC Provincial Nominee guidance"
  },
  {
    slug: "au/australia-global-talent", code: "NIV", country: "Australia", title: "Australia National Innovation Visa",
    eyebrow: "Formerly the Global Talent route", headline: "Exceptional contribution, considered nationally.",
    summary: "Australia's invitation-only National Innovation visa is a small, exclusive permanent route for exceptionally talented people who can make significant contributions.",
    signal: "The former Global Talent visa was replaced in December 2024. This page keeps the original URL while presenting the current program.",
    definition: "The National Innovation (subclass 858) visa replaced the former Global Talent visa. Candidates first submit an expression of interest and must be invited before applying.",
    frameworkTitle: "Current priority signals", framework: ["Top-of-field international recognition", "Nomination by an expert Australian or government agency", "Contribution in critical technologies, renewables, health, agri-food, defence or space", "Evidence of the impact you can make in Australia"],
    candidates: ["Global award recipients", "Researchers and innovators", "Entrepreneurs and investors", "Athletes and creative leaders", "High-impact specialists"],
    benefits: ["Permanent visa pathway", "Invitation-led assessment", "Cross-sector eligibility", "Family members may be included"],
    officialUrl: "https://immi.homeaffairs.gov.au/visas/working-in-australia/visas-for-innovation/national-innovation-visa", officialLabel: "Australian Home Affairs NIV guidance",
    note: "Program names, invitation priorities, and evidence requirements change. The assessment confirms the current route before any engagement."
  },
  {
    slug: "eu/de/germany-eu-blue-card", code: "EU/BC", country: "Germany", title: "Germany EU Blue Card",
    eyebrow: "Skilled employment in Germany", headline: "A qualified role can become a long-term European base.",
    summary: "For qualifying professionals with recognized academic or comparable tertiary credentials and an eligible German job offer meeting current salary rules.",
    signal: "Role, qualification, salary, and occupation all matter. Thresholds are updated regularly.",
    definition: "The EU Blue Card is a residence title for qualified employment. Eligibility depends on recognized qualifications, a qualifying role, and the applicable salary threshold, with special provisions for shortage occupations and some recent graduates.",
    frameworkTitle: "What Migrz checks", framework: ["Recognition or comparability of qualifications", "Employment contract or binding job offer", "Current salary threshold", "Shortage-occupation or new-entrant provisions", "A long-term settlement plan and language goals"],
    candidates: ["Technology professionals", "Engineers", "Healthcare and life-science specialists", "Researchers", "Other qualified professionals with German offers"],
    benefits: ["Residence for qualified employment", "Facilitated family options", "Potential settlement after 21 or 27 months for qualifying Blue Card holders", "EU mobility framework"],
    officialUrl: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card", officialLabel: "Make it in Germany EU Blue Card guidance"
  },
  {
    slug: "uae/dubai-golden-visa", code: "DGV", country: "United Arab Emirates", title: "Dubai Golden Visa",
    eyebrow: "Long-term UAE residence", headline: "Build from a global base designed for movement.",
    summary: "A long-term renewable residence framework for investors, entrepreneurs, scientists, exceptional talents, outstanding students, and other eligible categories.",
    signal: "The right category determines the evidence, nominating authority, residence duration, and application route.",
    definition: "The UAE Golden visa enables qualifying foreign talent to live, work, or study in the country without a traditional sponsor. Depending on category, residence may be granted for five or ten years.",
    frameworkTitle: "Categories Migrz evaluates", framework: ["Investors and real-estate investors", "Entrepreneurs with qualifying innovative projects", "Scientists, inventors, and exceptional talents", "Executives and specialists in priority fields", "Outstanding graduates and students"],
    candidates: ["Entrepreneurs and investors", "Executives", "Scientists and specialists", "Creative professionals", "Outstanding students and graduates"],
    benefits: ["Five- or ten-year renewable residence depending on category", "No traditional sponsor", "Family sponsorship options", "Extended time outside the UAE may be permitted"],
    officialUrl: "https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa", officialLabel: "Official UAE Golden visa guidance"
  }
];

export const routeSlugs = [
  "what-makes-us-different", ...pathways.map((p) => p.slug), "process", "98-success-rate", "case-studies", "customers", "faqs", "about", "team", "assessment", "privacy", "terms", "cookie-policy", "accessibility", "disclaimer"
];

export const faqGroups = [
  { title: "Getting started", items: [
    ["What exactly does Migrz do?", "Migrz is a specialized immigration consulting technology firm focused on achievement-based permanent-residency pathways. We assess your record, compare relevant routes, build the evidence strategy, and support preparation and case management."],
    ["What is the first step?", "The first step is a paid professional assessment. Migrz reviews your profile across relevant routes and delivers a written eligibility and strategy report, followed by an expert consultation."],
    ["Why is the assessment paid?", "The assessment is a standalone professional service: evidence review, pathway comparison, gap analysis, a written report, and expert time. It is not a sales call."],
  ]},
  { title: "Eligibility and qualifications", items: [
    ["Do I need a PhD?", "No. Some successful routes value advanced research, but qualification depends on the route and the full evidence record. Industry impact, leadership, original work, recognition, and commercial outcomes may also matter."],
    ["Can I qualify without publications?", "Possibly. Publications are one form of evidence, not a universal requirement. The assessment identifies which evidence categories are credible for your field and route."],
    ["Can Migrz guarantee approval?", "No legitimate professional can guarantee a government decision. Migrz can assess fit, decline weak cases, strengthen presentation, and manage the process, but the deciding authority controls the outcome."],
  ]},
  { title: "Process and timing", items: [
    ["How long does the assessment take?", "Migrz states that the assessment report is delivered within 48 hours after receiving the required information and evidence."],
    ["Who handles my case?", "Migrz describes a specialist, founder-led model rather than a generalist high-volume service. Your engagement scope should identify the responsible team and any independent legal provider."],
    ["How long will immigration processing take?", "Government processing varies by route, location, evidence, and policy changes. Migrz provides a case-specific timeline but cannot control government processing."],
  ]},
  { title: "Cost and engagement", items: [
    ["How much is the professional assessment?", "The current Migrz process page lists the professional assessment at $350. Confirm the current price and scope on the assessment form before payment."],
    ["What happens if I do not qualify?", "You still receive the assessment findings. A responsible outcome may be a future evidence plan, a different route, or a clear recommendation not to proceed."],
    ["Is Migrz a law firm?", "Migrz states that it is not a law firm and that legal services, where required, are provided by independent attorneys under a separate agreement."],
  ]},
  { title: "Evidence and case preparation", items: [
    ["What counts as strong evidence?", "Strong evidence is specific, verifiable, relevant to the legal criterion, and understandable to a decision-maker outside your industry. Depending on the pathway, that may include awards, independent media, publications, citations, patents, product adoption, revenue, funding, judging, selective memberships, critical roles, salary records, recommendation letters, employment documents, language results, or proof of public benefit. Migrz evaluates both the document and what it actually proves."],
    ["Are recommendation letters enough?", "Usually not on their own. A recommendation letter can explain technical work, establish context, or provide an independent expert view, but it is strongest when supported by objective records. The preparation process connects each testimonial to exhibits such as contracts, metrics, published material, adoption evidence, research records, or organizational documents."],
    ["What if some of my achievements are confidential?", "Confidential work can sometimes be documented through redacted records, authorized employer statements, public outcomes, technical descriptions that omit protected information, or other corroborating evidence. Migrz will not ask you to violate an agreement or disclose trade secrets. The assessment identifies what can be proved responsibly and where an alternative exhibit is needed."],
    ["Do you help organize an incomplete record?", "Yes. Many applicants begin with a strong career but a scattered evidence archive. The assessment identifies missing categories, and the preparation stage creates a document plan, naming conventions, responsibility list, and evidence narrative. This does not create achievements that do not exist; it helps make real achievements legible and verifiable."],
  ]},
  { title: "Choosing a country or pathway", items: [
    ["Should I choose the country before the assessment?", "You can have a preferred destination, but the assessment should still compare realistic alternatives. Countries differ in eligibility, sponsorship, cost, processing, family rights, settlement, taxation, career flexibility, and evidence burden. Migrz uses your priorities alongside your qualifications so the recommendation is both legally credible and personally useful."],
    ["Can one profile support more than one route?", "Yes. The same career may support different legal arguments. A research or technology leader, for example, might explore EB-1A, NIW, UK Global Talent, Canada's economic programs, or Australia's invitation-led route. Each program asks different questions, so evidence should be selected and explained for the chosen standard rather than copied unchanged between applications."],
    ["Will Migrz recommend waiting?", "Yes. If an application would be premature, the responsible recommendation may be a six- or twelve-month evidence plan, stronger language results, a clearer proposed endeavor, additional independent recognition, or a different route. Waiting is useful only when the plan names specific gaps and actions rather than giving a vague instruction to improve your profile."],
  ]},
];
