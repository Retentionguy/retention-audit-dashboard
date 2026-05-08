const { getDb, initSchema } = require('./pte-schema');

const db = getDb();
initSchema(db);

// Wipe existing PTE data
db.exec(`
  DELETE FROM user_answers;
  DELETE FROM attempts;
  DELETE FROM questions;
  DELETE FROM tests;
`);

// ── Tests ────────────────────────────────────────────────────────────────────
const testDefs = [
  { title: 'Full Mock Test 1', type: 'full', difficulty: 'easy',   duration: 90, credit_cost: 1, description: 'A complete PTE Academic simulation covering all four sections. Ideal for first-time test takers.' },
  { title: 'Full Mock Test 2', type: 'full', difficulty: 'medium', duration: 90, credit_cost: 1, description: 'Full-length mock with academic topics across science, environment and society.' },
  { title: 'Full Mock Test 3', type: 'full', difficulty: 'medium', duration: 90, credit_cost: 1, description: 'Business and economics themed full mock — great for MBA applicants.' },
  { title: 'Full Mock Test 4', type: 'full', difficulty: 'hard',   duration: 90, credit_cost: 1, description: 'Advanced full mock with complex academic vocabulary and dense passages.' },
  { title: 'Full Mock Test 5', type: 'full', difficulty: 'medium', duration: 90, credit_cost: 1, description: 'Health, medicine, and life sciences themed full mock test.' },
  { title: 'Full Mock Test 6', type: 'full', difficulty: 'hard',   duration: 90, credit_cost: 1, description: 'Technology, AI, and digital society — challenging full mock test.' },
  { title: 'Full Mock Test 7', type: 'full', difficulty: 'medium', duration: 90, credit_cost: 1, description: 'History, culture, and humanities themed full mock test.' },
  { title: 'Full Mock Test 8', type: 'full', difficulty: 'easy',   duration: 90, credit_cost: 1, description: 'Accessible full mock with everyday academic topics. Great for building confidence.' },
  { title: 'Full Mock Test 9', type: 'full', difficulty: 'hard',   duration: 90, credit_cost: 1, description: 'Research and methodology focused — mirrors the hardest PTE exam sittings.' },
  { title: 'Full Mock Test 10', type: 'full', difficulty: 'medium', duration: 90, credit_cost: 1, description: 'Environment, climate, and sustainability themed full mock.' },
  { title: 'Speaking Practice', type: 'speaking', difficulty: 'medium', duration: 45, credit_cost: 1, description: 'Targeted speaking practice covering Read Aloud, Repeat Sentence, Describe Image, Re-tell Lecture, and Answer Short Question.' },
  { title: 'Writing Practice',  type: 'writing',  difficulty: 'medium', duration: 40, credit_cost: 1, description: 'Focus on Summarize Written Text and Write Essay with academic prompts.' },
  { title: 'Reading Practice',  type: 'reading',  difficulty: 'medium', duration: 40, credit_cost: 1, description: 'All five reading question types in a focused practice session.' },
  { title: 'Listening Practice',type: 'listening',difficulty: 'medium', duration: 45, credit_cost: 1, description: 'All eight listening question types including Write from Dictation.' },
  { title: 'Mini Mock 1 — Easy',   type: 'mini', difficulty: 'easy',   duration: 30, credit_cost: 1, description: 'A short 25-question mini mock for quick practice.' },
  { title: 'Mini Mock 2 — Medium', type: 'mini', difficulty: 'medium', duration: 30, credit_cost: 1, description: 'Medium difficulty mini mock covering core question types.' },
  { title: 'Mini Mock 3 — Hard',   type: 'mini', difficulty: 'hard',   duration: 30, credit_cost: 1, description: 'Hard mini mock for exam-ready students aiming for 79+.' },
  { title: 'Repeat Sentence Drill',   type: 'speaking', difficulty: 'medium', duration: 20, credit_cost: 1, description: 'Intensive 25-question Repeat Sentence drill to boost memory and pronunciation.' },
  { title: 'Write from Dictation Drill', type: 'listening', difficulty: 'medium', duration: 25, credit_cost: 1, description: '25 Write from Dictation questions — the highest-value listening skill.' },
  { title: 'Reading Fill Blanks Drill', type: 'reading', difficulty: 'medium', duration: 25, credit_cost: 1, description: '20 fill-in-the-blank reading questions with academic vocabulary focus.' },
];

const insertedTests = [];
const insertTest = db.prepare(`INSERT INTO tests (title, type, difficulty, duration, credit_cost, description) VALUES (?, ?, ?, ?, ?, ?)`);
testDefs.forEach(t => {
  const r = insertTest.run(t.title, t.type, t.difficulty, t.duration, t.credit_cost, t.description);
  insertedTests.push({ ...t, id: r.lastInsertRowid });
});

// ── Question inserter ────────────────────────────────────────────────────────
const insertQ = db.prepare(`
  INSERT INTO questions (test_id, section, type, order_no, title, content, answer, scoring_guide, points, audio_text, time_limit)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function addQ(testId, section, type, order, title, content, answer, scoring, points, audioText, timeLimit) {
  insertQ.run(testId, section, type, order, title, JSON.stringify(content), JSON.stringify(answer), JSON.stringify(scoring), points, audioText || null, timeLimit || null);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const T = name => insertedTests.find(t => t.title === name)?.id;

// ════════════════════════════════════════════════════════════════════════════
// QUESTION BANKS
// ════════════════════════════════════════════════════════════════════════════

// ── READ ALOUD PASSAGES (20) ─────────────────────────────────────────────────
const readAloudPassages = [
  { title: 'Urban Biodiversity', text: 'Cities are increasingly recognised as important habitats for wildlife. Green roofs, urban gardens, and tree-lined streets provide corridors for birds, insects, and small mammals. Research shows that urban green spaces can support surprisingly high levels of biodiversity, sometimes rivalling those found in protected natural areas.' },
  { title: 'Quantum Computing', text: 'Quantum computers exploit the principles of superposition and entanglement to perform calculations that classical machines cannot efficiently execute. While still in early stages of development, these systems hold tremendous promise for solving complex optimisation problems in logistics, drug discovery, and materials science.' },
  { title: 'Ocean Acidification', text: 'As atmospheric carbon dioxide levels rise, the oceans absorb a significant portion of this gas, triggering chemical reactions that lower seawater pH. This process, known as ocean acidification, poses a severe threat to marine ecosystems, particularly to coral reefs and shell-forming organisms whose calcium carbonate structures dissolve in more acidic waters.' },
  { title: 'The Gut Microbiome', text: 'The human digestive tract is home to trillions of microorganisms collectively known as the gut microbiome. These bacteria, fungi, and viruses play essential roles in digestion, immune function, and even mental health. Disruptions to the microbiome have been linked to conditions ranging from inflammatory bowel disease to anxiety and depression.' },
  { title: 'Renewable Energy Transition', text: 'The global shift toward renewable energy sources is accelerating, driven by falling costs and growing environmental awareness. Solar and wind power are now competitive with fossil fuels in many markets. However, the intermittent nature of these sources presents significant challenges for grid operators who must balance supply and demand in real time.' },
  { title: 'Artificial Intelligence in Medicine', text: 'Machine learning algorithms are transforming medical diagnosis, with some systems demonstrating accuracy comparable to that of experienced clinicians in detecting cancers, retinal diseases, and cardiac abnormalities from imaging data. Despite this progress, questions remain about transparency, liability, and the appropriate role of human oversight in clinical decision-making.' },
  { title: 'Language Extinction', text: 'Linguists estimate that approximately half of the world\'s seven thousand languages will fall silent by the end of this century. When a language disappears, humanity loses not only a unique communication system but also a rich body of cultural knowledge, oral traditions, and ways of understanding the natural world that may never be recovered.' },
  { title: 'Remote Work Revolution', text: 'The widespread adoption of remote work, accelerated by the global pandemic, has prompted organisations to fundamentally rethink office design, management practices, and employee wellbeing strategies. While many workers report higher satisfaction and productivity at home, concerns persist about social isolation, career advancement inequity, and the erosion of collaborative workplace culture.' },
  { title: 'Neuroplasticity', text: 'The brain\'s remarkable ability to reorganise itself by forming new neural connections throughout life is known as neuroplasticity. This property underlies learning, memory, and recovery from injury. Recent research suggests that targeted cognitive training, physical exercise, and mindfulness practice can all stimulate neuroplastic changes with measurable benefits for mental performance.' },
  { title: 'Supply Chain Resilience', text: 'Recent global disruptions have exposed the fragility of highly optimised, just-in-time supply chains. Companies are now investing in greater inventory buffers, supplier diversification, and digital monitoring systems to build resilience. Economists warn, however, that these measures come at a cost that may ultimately be passed on to consumers in the form of higher prices.' },
  { title: 'Vertical Farming', text: 'Vertical farms stack crops in controlled indoor environments, using LED lighting and hydroponic systems to produce food year-round without the limitations of climate or season. Proponents argue these facilities can dramatically reduce water consumption and eliminate the need for pesticides, though critics note that energy costs remain a significant barrier to widespread commercial viability.' },
  { title: 'Dark Matter', text: 'Despite constituting roughly twenty-seven percent of the universe\'s total mass-energy content, dark matter has never been directly observed. Its existence is inferred from gravitational effects on visible matter, including the anomalous rotation curves of galaxies. Identifying the particles that make up dark matter remains one of the most compelling unsolved problems in modern physics.' },
  { title: 'Financial Literacy', text: 'Studies consistently show that individuals with higher levels of financial literacy make better decisions about saving, investing, and borrowing, leading to greater long-term wealth accumulation and reduced vulnerability to financial stress. Despite its importance, financial education remains poorly integrated into school curricula in many countries, leaving young people ill-equipped for adult economic life.' },
  { title: 'Coral Restoration', text: 'Scientists are developing innovative techniques to restore damaged coral reefs, including coral gardening, assisted evolution, and the deployment of electrically charged structures that accelerate calcium carbonate deposition. While these interventions show promise in pilot projects, experts caution that without addressing the underlying causes of reef degradation, restoration efforts will only provide temporary relief.' },
  { title: 'Misinformation Spread', text: 'Research into the dynamics of online misinformation suggests that false stories spread faster and further than accurate reporting on social media platforms. This phenomenon is partly explained by the emotional arousal that novel, surprising content provokes in readers, making them more likely to share it. Platform designers and policymakers face difficult trade-offs between free expression and the public harm caused by viral falsehoods.' },
  { title: 'Sleep Science', text: 'Sleep is now understood to perform critical maintenance functions for both the brain and the body, including the clearance of metabolic waste products, consolidation of memories, and restoration of immune function. Chronic sleep deprivation has been linked to elevated risks of obesity, cardiovascular disease, diabetes, and neurodegenerative conditions, yet surveys indicate that a significant proportion of adults regularly fail to obtain the recommended seven to nine hours.' },
  { title: 'Gig Economy', text: 'The proliferation of platform-based work arrangements has created a new category of economic actor — the gig worker — who operates outside traditional employment relationships. While this model offers flexibility and autonomy, it also denies workers access to benefits such as paid leave, superannuation contributions, and employer-funded health insurance, raising questions about the adequacy of existing labour protection frameworks.' },
  { title: 'Antibiotic Resistance', text: 'The overuse and misuse of antibiotics in human medicine and agriculture has accelerated the evolution of drug-resistant bacteria, threatening to render common infections untreatable. The World Health Organisation has identified antimicrobial resistance as one of the most serious global health threats of the twenty-first century, calling for coordinated international action to extend the effective lifespan of existing antimicrobial agents.' },
  { title: 'Autonomous Vehicles', text: 'Self-driving vehicles promise to reduce road accidents caused by human error, improve traffic flow through vehicle-to-vehicle communication, and provide mobility solutions for elderly and disabled populations. However, the technology still struggles with unpredictable real-world conditions, and unresolved ethical, regulatory, and cybersecurity challenges are slowing the transition from controlled trials to widespread public deployment.' },
  { title: 'Cultural Heritage Preservation', text: 'Digital technologies are transforming the field of cultural heritage preservation, enabling high-resolution three-dimensional scans of fragile artefacts and immersive virtual reconstructions of ancient sites. These tools allow researchers to study objects without physical handling and provide public access to collections that would otherwise remain locked in storage, though questions of data ownership and long-term digital preservation remain unresolved.' },
];

// ── REPEAT SENTENCE (25) ─────────────────────────────────────────────────────
const repeatSentences = [
  'The government has announced a series of measures to address the housing affordability crisis.',
  'Researchers at the university discovered a new compound with potential anti-cancer properties.',
  'The committee will review all submitted applications before the end of the fiscal quarter.',
  'Climate change is expected to increase the frequency and severity of extreme weather events.',
  'Students are encouraged to consult with their academic advisors before selecting elective units.',
  'The findings suggest a strong correlation between early childhood education and long-term academic outcomes.',
  'Digital transformation is reshaping traditional industries at an unprecedented rate.',
  'The new trade agreement is expected to boost exports and create thousands of jobs in the region.',
  'Biodiversity loss poses significant risks to ecosystem stability and human food security.',
  'The central bank raised interest rates for the third consecutive time to combat inflation.',
  'Advances in gene-editing technology raise profound ethical questions about human enhancement.',
  'The library will be closed for renovations throughout the summer semester.',
  'A balanced diet rich in plant-based foods is associated with reduced risk of chronic disease.',
  'The professor outlined the assessment criteria and submission requirements for the research project.',
  'International cooperation is essential for addressing the challenge of plastic pollution in the oceans.',
  'The new transportation hub will significantly reduce commute times for thousands of daily passengers.',
  'Neuroscientists have identified the brain regions responsible for emotional regulation and decision-making.',
  'All candidates must submit their portfolio and a personal statement by the closing date.',
  'The pharmaceutical company announced positive results from its phase three clinical trial.',
  'Urban planning must account for the social and environmental needs of diverse communities.',
  'The scholarship programme is open to students from all academic disciplines and backgrounds.',
  'Renewable energy investment reached record levels globally for the fourth consecutive year.',
  'The panel of experts concluded that more longitudinal research is needed before policy recommendations can be made.',
  'Artificial intelligence systems must be designed with fairness, accountability, and transparency in mind.',
  'The excavation revealed artefacts dating back more than three thousand years to the Bronze Age.',
];

// ── ANSWER SHORT QUESTIONS (25) ─────────────────────────────────────────────
const answerShortQs = [
  { q: 'What is the chemical symbol for water?', a: 'H2O', alts: ['water'] },
  { q: 'Which organ is responsible for pumping blood through the body?', a: 'heart', alts: [] },
  { q: 'What do we call the process by which plants make food using sunlight?', a: 'photosynthesis', alts: [] },
  { q: 'What is the name of the layer of gases surrounding the Earth?', a: 'atmosphere', alts: ['the atmosphere'] },
  { q: 'How many sides does a hexagon have?', a: 'six', alts: ['6'] },
  { q: 'What is the largest ocean on Earth?', a: 'Pacific Ocean', alts: ['Pacific', 'the Pacific'] },
  { q: 'What type of energy is produced by the sun?', a: 'solar energy', alts: ['solar', 'light energy', 'heat energy'] },
  { q: 'What instrument measures temperature?', a: 'thermometer', alts: [] },
  { q: 'What is the term for a word that means the opposite of another word?', a: 'antonym', alts: [] },
  { q: 'What gas do humans exhale when breathing out?', a: 'carbon dioxide', alts: ['CO2'] },
  { q: 'What is the process called when a liquid turns into a gas?', a: 'evaporation', alts: ['vaporisation', 'vaporization'] },
  { q: 'What is the name of the world\'s longest river?', a: 'Nile', alts: ['the Nile', 'Nile River'] },
  { q: 'What part of a plant absorbs water and nutrients from the soil?', a: 'roots', alts: ['root system', 'the roots'] },
  { q: 'What branch of science studies living organisms?', a: 'biology', alts: [] },
  { q: 'What is the currency of Japan?', a: 'yen', alts: ['Japanese yen'] },
  { q: 'How many players are on a standard football team on the field?', a: 'eleven', alts: ['11'] },
  { q: 'What does DNA stand for?', a: 'deoxyribonucleic acid', alts: ['DNA'] },
  { q: 'What force keeps planets in orbit around the sun?', a: 'gravity', alts: ['gravitational force'] },
  { q: 'What is the study of the Earth\'s physical structure and substance called?', a: 'geology', alts: [] },
  { q: 'What is the name for a group of stars that forms a recognisable pattern?', a: 'constellation', alts: [] },
  { q: 'Which vitamin is produced by the body when exposed to sunlight?', a: 'vitamin D', alts: ['Vitamin D'] },
  { q: 'What type of government is run by the people, either directly or through elected representatives?', a: 'democracy', alts: [] },
  { q: 'What is the boiling point of water at sea level in degrees Celsius?', a: '100', alts: ['100 degrees', 'one hundred'] },
  { q: 'What instrument is used to measure atmospheric pressure?', a: 'barometer', alts: [] },
  { q: 'What do economists call the total value of goods and services produced by a country?', a: 'GDP', alts: ['gross domestic product'] },
];

// ── DESCRIBE IMAGE data (15) ─────────────────────────────────────────────────
const describeImages = [
  {
    title: 'Global Renewable Energy Share',
    image_type: 'bar_chart',
    description: 'Bar chart showing renewable energy as a percentage of total electricity generation in six countries in 2023',
    data: {
      labels: ['Norway', 'Iceland', 'Brazil', 'Germany', 'Australia', 'USA'],
      datasets: [{ label: 'Renewable Share (%)', data: [98, 99, 83, 46, 35, 21], backgroundColor: '#3b82f6' }],
    },
    key_points: ['Norway and Iceland generate almost all electricity from renewables', 'Brazil has 83% renewable share', 'USA has the lowest at 21%'],
  },
  {
    title: 'World Population Growth',
    image_type: 'line_graph',
    description: 'Line graph showing world population in billions from 1950 to 2023',
    data: {
      labels: ['1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020', '2023'],
      datasets: [{ label: 'Population (billions)', data: [2.5, 3.0, 3.7, 4.4, 5.3, 6.1, 6.9, 7.8, 8.0], borderColor: '#7c3aed', fill: false, tension: 0.3 }],
    },
    key_points: ['Population has more than tripled since 1950', 'Growth rate appears to be slowing in recent decades', 'World reached 8 billion in 2022'],
  },
  {
    title: 'Global Energy Sources',
    image_type: 'pie_chart',
    description: 'Pie chart showing the breakdown of global primary energy consumption by source in 2022',
    data: {
      labels: ['Oil', 'Coal', 'Natural Gas', 'Nuclear', 'Hydro', 'Wind/Solar'],
      data: [31, 27, 24, 5, 7, 6],
    },
    key_points: ['Fossil fuels account for 82% of energy', 'Oil is the single largest source at 31%', 'Renewables including hydro represent 13%'],
  },
  {
    title: 'University Enrolment by Field',
    image_type: 'bar_chart',
    description: 'Bar chart comparing university enrolment in different fields of study between 2010 and 2023',
    data: {
      labels: ['Engineering', 'Business', 'Health', 'Arts', 'Science', 'Education'],
      datasets: [
        { label: '2010', data: [18, 25, 14, 20, 12, 11], backgroundColor: '#93c5fd' },
        { label: '2023', data: [22, 23, 21, 15, 14, 5], backgroundColor: '#3b82f6' },
      ],
    },
    key_points: ['Health enrolments increased significantly', 'Education declined sharply', 'Engineering and health grew while arts fell'],
  },
  {
    title: 'Average Annual Temperatures',
    image_type: 'line_graph',
    description: 'Line graph showing average global temperature anomaly from 1900 to 2023 relative to 1900 baseline',
    data: {
      labels: ['1900', '1920', '1940', '1960', '1980', '2000', '2010', '2023'],
      datasets: [{ label: 'Temp Anomaly (°C)', data: [0.0, 0.1, 0.2, 0.1, 0.3, 0.6, 0.9, 1.2], borderColor: '#ef4444', fill: false, tension: 0.3 }],
    },
    key_points: ['Clear upward trend since 1980', 'Temperature has risen 1.2°C since 1900', 'Rate of warming accelerating in recent decades'],
  },
  {
    title: 'Internet Users by Region',
    image_type: 'bar_chart',
    description: 'Horizontal bar chart showing internet penetration rates by world region in 2023',
    data: {
      labels: ['North America', 'Europe', 'Latin America', 'East Asia', 'Middle East', 'South Asia', 'Africa'],
      datasets: [{ label: 'Internet Penetration (%)', data: [93, 88, 78, 72, 67, 46, 40], backgroundColor: '#10b981' }],
    },
    key_points: ['North America leads at 93%', 'Africa has lowest penetration at 40%', 'Large digital divide between regions'],
  },
  {
    title: 'Smartphone Market Share',
    image_type: 'pie_chart',
    description: 'Pie chart showing global smartphone operating system market share in 2023',
    data: {
      labels: ['Android', 'iOS', 'Other'],
      data: [72, 27, 1],
    },
    key_points: ['Android dominates with 72% market share', 'iOS has 27% share', 'Other OS systems are negligible'],
  },
  {
    title: 'Global CO2 Emissions by Sector',
    image_type: 'pie_chart',
    description: 'Pie chart showing breakdown of global CO2 emissions by economic sector',
    data: {
      labels: ['Energy', 'Transport', 'Industry', 'Agriculture', 'Buildings', 'Other'],
      data: [34, 16, 24, 11, 6, 9],
    },
    key_points: ['Energy sector is the largest emitter at 34%', 'Industry contributes 24%', 'Transport accounts for 16%'],
  },
  {
    title: 'Employment Rates by Education Level',
    image_type: 'bar_chart',
    description: 'Bar chart showing employment rates (%) for different education levels in OECD countries, 2022',
    data: {
      labels: ['Below secondary', 'Upper secondary', 'Post-secondary', "Bachelor's", "Master's+"],
      datasets: [{ label: 'Employment Rate (%)', data: [54, 72, 79, 85, 89], backgroundColor: '#f59e0b' }],
    },
    key_points: ['Employment rate rises with education level', 'Masters+ holders have 89% employment rate', 'Large gap between below secondary and bachelor level'],
  },
  {
    title: 'Healthcare Expenditure vs Life Expectancy',
    image_type: 'table',
    description: 'Table comparing healthcare spending per capita and life expectancy for selected countries',
    data: {
      headers: ['Country', 'Health Spend (USD)', 'Life Expectancy (yrs)'],
      rows: [
        ['USA', '$12,318', '77.5'],
        ['Switzerland', '$9,666', '83.4'],
        ['Norway', '$7,842', '83.2'],
        ['Australia', '$6,432', '83.4'],
        ['UK', '$5,268', '81.3'],
        ['Japan', '$4,823', '84.3'],
      ],
    },
    key_points: ['USA spends most but has lower life expectancy', 'Japan has highest life expectancy with moderate spending', 'No direct correlation between spending and outcomes'],
  },
  {
    title: 'Social Media Usage by Age Group',
    image_type: 'bar_chart',
    description: 'Grouped bar chart showing weekly social media hours by age group and platform',
    data: {
      labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
      datasets: [
        { label: 'Instagram', data: [8.2, 6.5, 4.1, 2.8, 1.5], backgroundColor: '#e879f9' },
        { label: 'Facebook', data: [3.1, 4.8, 6.2, 7.1, 7.8], backgroundColor: '#3b82f6' },
        { label: 'TikTok', data: [10.5, 5.2, 2.1, 0.8, 0.3], backgroundColor: '#f43f5e' },
      ],
    },
    key_points: ['TikTok usage highest in 18-24 group', 'Facebook usage increases with age', 'Younger users spend more time on social media overall'],
  },
  {
    title: 'Water Scarcity Risk',
    image_type: 'table',
    description: 'Table showing water stress levels and projections for major world regions',
    data: {
      headers: ['Region', '2020 Stress Level', '2040 Projection', 'Population Affected (M)'],
      rows: [
        ['Middle East', 'Extremely High', 'Critical', '410'],
        ['North Africa', 'Extremely High', 'Critical', '220'],
        ['Central Asia', 'High', 'Extremely High', '68'],
        ['South Asia', 'High', 'Extremely High', '1800'],
        ['Southern Europe', 'Medium-High', 'High', '185'],
        ['Sub-Saharan Africa', 'Medium', 'High', '600'],
      ],
    },
    key_points: ['Middle East and North Africa face critical water stress', 'South Asia has largest affected population', 'All regions projected to worsen by 2040'],
  },
  {
    title: 'GDP Growth Comparison',
    image_type: 'line_graph',
    description: 'Line graph comparing annual GDP growth rates (%) for China, USA, and EU from 2015 to 2023',
    data: {
      labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
      datasets: [
        { label: 'China', data: [6.9, 6.7, 6.9, 6.7, 6.0, 2.3, 8.1, 3.0, 5.2], borderColor: '#ef4444', fill: false },
        { label: 'USA', data: [2.9, 1.6, 2.3, 2.9, 2.3, -3.4, 5.9, 2.1, 2.5], borderColor: '#3b82f6', fill: false },
        { label: 'EU', data: [2.1, 1.9, 2.5, 2.1, 1.5, -6.4, 5.4, 3.5, 0.5], borderColor: '#10b981', fill: false },
      ],
    },
    key_points: ['China consistently outgrows USA and EU', 'All three regions contracted in 2020 due to pandemic', 'EU had sharpest contraction and slowest 2023 recovery'],
  },
  {
    title: 'Global Obesity Rates',
    image_type: 'bar_chart',
    description: 'Bar chart showing adult obesity rates (%) in selected countries, 2022',
    data: {
      labels: ['USA', 'Mexico', 'Australia', 'UK', 'Germany', 'France', 'Japan', 'South Korea'],
      datasets: [{ label: 'Obesity Rate (%)', data: [36.2, 28.9, 29.0, 27.8, 22.3, 17.0, 4.3, 4.7], backgroundColor: '#f97316' }],
    },
    key_points: ['USA has highest obesity rate at 36%', 'Asian countries have much lower rates', 'Australia and Mexico have similar rates around 29%'],
  },
  {
    title: 'Electric Vehicle Sales Growth',
    image_type: 'line_graph',
    description: 'Line graph showing global electric vehicle sales in millions from 2018 to 2023',
    data: {
      labels: ['2018', '2019', '2020', '2021', '2022', '2023'],
      datasets: [{ label: 'EV Sales (millions)', data: [2.0, 2.2, 3.1, 6.6, 10.5, 14.2], borderColor: '#3b82f6', fill: false, tension: 0.4 }],
    },
    key_points: ['EV sales grew seven-fold in five years', 'Acceleration after 2020', '14.2 million sold in 2023'],
  },
];

// ── RE-TELL LECTURE (10) ──────────────────────────────────────────────────────
const retellLectures = [
  {
    title: 'The Placebo Effect',
    topic: 'Medicine',
    lecture: 'Today I want to talk about one of the most fascinating phenomena in medicine — the placebo effect. A placebo is an inactive substance or treatment that produces a measurable physiological response in the patient. For decades, scientists assumed the placebo effect was purely psychological — patients simply believed they felt better. However, modern neuroimaging has revealed that placebos can trigger real biological changes. Brain scans show that patients given a placebo painkiller release endogenous opioids — the same natural compounds activated by real pain medication. The implications for clinical practice are significant. Doctors must balance therapeutic honesty with the knowledge that positive expectations can improve patient outcomes. Some researchers even argue for open-label placebos, where patients are told they are receiving a placebo but still show improvement.',
    key_points: ['Placebo effect produces real biological changes', 'Brain releases natural opioids in response to placebos', 'Open-label placebos may still be effective'],
  },
  {
    title: 'Circular Economy',
    topic: 'Economics & Environment',
    lecture: 'The circular economy represents a fundamental redesign of how we produce and consume goods. Unlike the traditional linear economy — take, make, dispose — the circular model aims to keep materials in use for as long as possible. Products are designed to be repaired, refurbished, remanufactured, or recycled. This approach reduces waste, cuts carbon emissions, and creates new business opportunities. Companies like Renault have already implemented circular principles in manufacturing, reprocessing millions of engine parts annually. Studies suggest that transitioning to a circular economy in Europe alone could generate up to 1.8 trillion euros in economic benefits by 2030, while significantly reducing pressure on natural resources.',
    key_points: ['Circular economy keeps materials in use', 'Contrast with linear take-make-dispose model', 'Economic benefits estimated at 1.8 trillion euros for Europe'],
  },
  {
    title: 'Memory Consolidation During Sleep',
    topic: 'Neuroscience',
    lecture: 'Sleep is not merely a period of rest — it is a time of intense cognitive processing. Research in the past two decades has established that the sleeping brain actively consolidates memories acquired during the day. During slow-wave sleep, the hippocampus replays recent experiences and transfers information to the neocortex for long-term storage. REM sleep, characterised by rapid eye movements and vivid dreaming, appears to be particularly important for emotional memory processing and creative problem-solving. Studies show that students who sleep after learning perform significantly better on tests than those who remain awake. These findings have practical implications for educational scheduling and the management of shift work.',
    key_points: ['Sleep consolidates memories from hippocampus to neocortex', 'Slow-wave sleep transfers information to long-term storage', 'REM sleep processes emotional memories and creativity'],
  },
  {
    title: 'The Tragedy of the Commons',
    topic: 'Economics',
    lecture: 'The tragedy of the commons is a concept introduced by ecologist Garrett Hardin in 1968 to describe how individuals, acting independently according to their own self-interest, can deplete a shared resource through their collective action. Hardin used the example of herders sharing a common pasture: each herder benefits fully from adding another animal but shares the cost of overgrazing with everyone else. The rational choice for each individual leads to the irrational destruction of the commons. This framework has been applied to fisheries, groundwater, the atmosphere, and even internet bandwidth. However, economist Elinor Ostrom — who won the Nobel Prize for her work — showed that communities can successfully manage common resources through self-governance and clearly defined rules.',
    key_points: ['Individual rational choices lead to collective irrational outcomes', 'Common resources can be overexploited', 'Ostrom showed communities can manage commons through governance'],
  },
  {
    title: 'CRISPR Gene Editing',
    topic: 'Biotechnology',
    lecture: 'CRISPR-Cas9 is a revolutionary gene-editing tool that has transformed biological research since its application to mammalian cells was demonstrated in 2013. The system works like molecular scissors: a guide RNA directs the Cas9 protein to a specific location in the genome, where it cuts the DNA. The cell\'s own repair mechanisms then fix the cut, either disabling the target gene or introducing a new sequence. CRISPR has been used to develop disease-resistant crops, model human diseases in laboratory animals, and most controversially, edit human embryos. Clinical trials are now underway for CRISPR-based treatments for sickle cell disease and certain cancers, with early results showing remarkable efficacy.',
    key_points: ['CRISPR-Cas9 acts as molecular scissors to edit DNA', 'Applications include crops, disease models, and medicine', 'Clinical trials for sickle cell disease showing promise'],
  },
  {
    title: 'Migration and Cities',
    topic: 'Sociology',
    lecture: 'Throughout history, cities have been shaped by waves of migration. Today, more than half the world\'s population lives in urban areas, and that proportion is expected to reach two-thirds by 2050, driven largely by rural-to-urban migration in developing countries. Migrants bring economic energy, cultural diversity, and entrepreneurial dynamism to cities. Studies consistently show that immigrants are overrepresented among startup founders and patent holders. However, rapid urbanisation also creates challenges: demand for housing, infrastructure, and public services can outpace supply, leading to inequality and social tension. The most successful cities are those that have developed inclusive policies to integrate newcomers while investing in the services all residents depend on.',
    key_points: ['Over half world population lives in cities', 'Migrants contribute economically and culturally', 'Rapid urbanisation creates housing and service challenges'],
  },
  {
    title: 'The Ocean Carbon Cycle',
    topic: 'Earth Science',
    lecture: 'The world\'s oceans play a critical role in regulating Earth\'s climate by absorbing approximately 25 to 30 percent of all carbon dioxide emitted by human activities each year. This carbon enters the ocean at the surface and is transported to depth through two main pathways. The physical pump moves carbon dioxide dissolved in cold, dense surface water down to the ocean floor as it sinks. The biological pump relies on photosynthetic organisms — primarily phytoplankton — which fix atmospheric carbon into organic matter. When these organisms die, their bodies sink, carrying carbon to the deep ocean. Disruption of these processes through warming and acidification threatens to reduce the ocean\'s carbon-absorbing capacity at precisely the moment we most need it.',
    key_points: ['Oceans absorb 25-30% of human CO2 emissions', 'Physical pump and biological pump transport carbon to depth', 'Warming threatens ocean carbon absorption capacity'],
  },
  {
    title: 'Behavioural Economics',
    topic: 'Economics',
    lecture: 'Traditional economics assumed that humans are rational actors who consistently make decisions in their best interest. Behavioural economics, pioneered by Daniel Kahneman and Amos Tversky, challenges this view by documenting the systematic biases and heuristics that lead people to make irrational choices. Loss aversion — our tendency to feel the pain of a loss more acutely than the pleasure of an equivalent gain — explains why investors hold losing stocks too long and sell winners too soon. The concept of nudging, developed by Richard Thaler and Cass Sunstein, uses insights from behavioural economics to design choice environments that steer people toward better decisions without restricting their freedom. Opt-out pension schemes, for instance, dramatically increase participation rates compared to opt-in systems.',
    key_points: ['Humans make systematic irrational decisions', 'Loss aversion causes poor financial decisions', 'Nudging uses choice architecture to improve outcomes'],
  },
  {
    title: 'Plastic in the Food Chain',
    topic: 'Environment',
    lecture: 'Plastic pollution has become so pervasive that microplastics — fragments smaller than five millimetres — are now found virtually everywhere on Earth, from deep ocean trenches to Arctic ice cores. Of particular concern is the presence of microplastics in the food chain. Marine organisms ingest plastic particles, which can absorb and concentrate persistent organic pollutants. These particles and associated chemicals move up the food chain through a process called biomagnification, reaching highest concentrations in top predators — including humans. Recent studies have detected microplastics in human blood, lungs, and placentas. While the health consequences are not yet fully understood, the finding that these contaminants are universally present in human tissue has prompted urgent calls for reduced plastic production and improved waste management.',
    key_points: ['Microplastics found everywhere including human tissue', 'Plastics enter food chain through marine organisms', 'Biomagnification concentrates pollutants up the food chain'],
  },
  {
    title: 'The History of Antibiotics',
    topic: 'Medical History',
    lecture: 'The discovery of penicillin by Alexander Fleming in 1928 is rightly celebrated as one of the most important events in medical history. Fleming noticed that a mould, Penicillium notatum, was killing the bacteria in his Petri dish. However, it was not until Howard Florey and Ernst Chain developed methods to purify and mass-produce penicillin in the early 1940s that it became a practical therapeutic tool. During the Second World War, penicillin saved countless lives from previously fatal infections. The subsequent decades saw a golden age of antibiotic discovery, with dozens of new classes developed. However, by the 1990s the pipeline had largely dried up, and simultaneously, overuse had accelerated the evolution of resistant bacteria. We now face the prospect of a post-antibiotic era in which common infections once again become deadly.',
    key_points: ['Fleming discovered penicillin in 1928', 'Florey and Chain enabled mass production', 'Antibiotic pipeline dried up while resistance grew'],
  },
];

// ── SUMMARIZE WRITTEN TEXT passages (15) ──────────────────────────────────────
const swtPassages = [
  {
    title: 'Rewilding',
    text: 'Rewilding is a progressive approach to conservation that focuses on restoring ecosystems by reintroducing species that once populated them and allowing natural processes to operate with minimal human intervention. Unlike traditional conservation, which often seeks to maintain ecosystems in a particular state, rewilding embraces dynamism and accepts that ecosystems will change over time. High-profile rewilding projects include the reintroduction of grey wolves to Yellowstone National Park in the United States, which has had cascading positive effects throughout the ecosystem — a phenomenon ecologists term a trophic cascade. The wolves reduced deer populations and altered their grazing patterns, allowing riverbank vegetation to recover, which in turn stabilised stream banks, reduced erosion, and improved fish habitat. Critics of rewilding argue that it can create conflict with farmers and landowners, and that reintroduced species may not always behave as expected in transformed landscapes.',
    sample: 'Rewilding, which involves reintroducing species to restore ecosystems, has shown cascading positive ecological benefits, as demonstrated by wolf reintroduction in Yellowstone, though critics raise concerns about conflicts with landowners.',
    key_points: ['Rewilding reintroduces species to restore ecosystems', 'Trophic cascade from wolf reintroduction in Yellowstone', 'Critics cite conflict with farmers'],
  },
  {
    title: 'The Value of Failure',
    text: 'In many educational systems and professional environments, failure is treated as something to be avoided at all costs. Yet a growing body of research suggests that this attitude may be counterproductive. Psychologists have shown that individuals who experience moderate failure and then reflect on it develop stronger problem-solving skills and greater resilience than those who succeed consistently. This process, known as productive failure, forces learners to activate prior knowledge and generate multiple solution strategies before receiving instruction. The resulting learning is deeper and more transferable than conventional teaching methods. Companies like Google and Amazon have institutionalised this insight, celebrating what they call intelligent failure — failed experiments that generate valuable data even when they do not achieve their primary objective. Finland\'s educational system, consistently ranked among the world\'s best, explicitly teaches students that mistakes are essential to learning.',
    sample: 'Research shows that experiencing and reflecting on failure builds resilience and problem-solving skills, and progressive organisations and educational systems like Finland\'s now embrace productive failure as essential to learning.',
    key_points: ['Moderate failure builds resilience and problem-solving', 'Productive failure deepens learning', 'Companies and Finland embrace intelligent failure'],
  },
  {
    title: 'Urban Heat Islands',
    text: 'Urban heat islands are metropolitan areas that are significantly warmer than surrounding rural areas due to human activities and the physical characteristics of cities. Dark impervious surfaces such as asphalt roads and rooftops absorb solar radiation and re-emit it as heat. Tall buildings reduce wind flow and create geometric configurations that trap radiation. Waste heat from vehicles, air conditioning, and industrial processes further warms the urban environment. The temperature difference between urban centres and rural areas can exceed five degrees Celsius, with the greatest disparities occurring at night. This phenomenon has serious public health consequences: heat-related illnesses and mortality increase significantly during heatwaves in urban areas. Mitigation strategies include increasing urban tree cover, installing green roofs, using reflective building materials, and creating urban waterways that provide evaporative cooling.',
    sample: 'Urban heat islands, where cities are warmer than surrounding areas due to heat-absorbing surfaces, reduced airflow, and waste heat, pose serious public health risks and can be mitigated through green infrastructure and reflective materials.',
    key_points: ['Cities are warmer due to surfaces, buildings and waste heat', 'Temperature difference up to 5°C versus rural areas', 'Mitigation includes trees, green roofs, reflective materials'],
  },
  {
    title: 'The Attention Economy',
    text: 'The attention economy refers to the economic system in which human attention is treated as a scarce commodity to be captured and monetised. Digital platforms — social media networks, streaming services, and online news sites — generate revenue primarily through advertising, which depends on capturing and retaining user attention. The result is an arms race to design products that are as engaging as possible, often using psychological techniques derived from behavioural research. Variable reward schedules, infinite scroll, autoplay, and personalised recommendation algorithms are all designed to maximise time on platform. Critics argue that these mechanisms are deliberately exploitative, undermining users\' ability to make autonomous choices about how they spend their time. The costs include reduced attention spans, increased anxiety and depression, disrupted sleep, and the spread of sensationalised content that captures attention more effectively than accurate reporting.',
    sample: 'The attention economy treats human attention as a scarce resource, with digital platforms using psychological techniques to maximise engagement, leading to reduced attention spans, mental health issues, and the spread of misinformation.',
    key_points: ['Attention is a scarce resource monetised by platforms', 'Psychological techniques maximise engagement', 'Consequences include mental health harm and misinformation'],
  },
  {
    title: 'Fasting and Metabolism',
    text: 'Intermittent fasting — the practice of cycling between periods of eating and fasting — has attracted considerable scientific interest for its potential metabolic benefits. Research in animals has consistently shown that caloric restriction and intermittent fasting extend lifespan and reduce the incidence of age-related diseases. Human studies have demonstrated that intermittent fasting can reduce insulin resistance, lower blood pressure, and decrease inflammatory markers. These benefits appear to be at least partly mediated by metabolic switching: when glycogen stores are depleted during fasting, the body shifts to burning fat-derived ketones for fuel, a state that may confer neuroprotective as well as metabolic benefits. However, experts caution that intermittent fasting is not appropriate for everyone and that its long-term effects in humans remain incompletely understood.',
    sample: 'Intermittent fasting triggers metabolic switching from glucose to ketones, producing benefits including reduced insulin resistance and lower blood pressure, though experts caution that its long-term effects in humans are not yet fully understood.',
    key_points: ['Intermittent fasting causes metabolic switching to ketones', 'Benefits include lower insulin resistance and blood pressure', 'Long-term human effects not fully understood'],
  },
];

// ── ESSAY PROMPTS (10) ──────────────────────────────────────────────────────
const essayPrompts = [
  { prompt: 'Some people believe that university education should be free for all students. Others argue that students should pay for their own education. Discuss both views and give your opinion.', type: 'discussion', key_arguments: ['free education reduces inequality', 'public funding improves human capital', 'personal investment increases motivation', 'graduate tax as middle ground', 'quality concerns with underfunding'] },
  { prompt: 'In many countries, people are living longer due to advances in healthcare. What are the advantages and disadvantages of an ageing population?', type: 'discussion', key_arguments: ['experience and wisdom of older workers', 'healthcare costs increase', 'pension system strain', 'silver economy opportunities', 'intergenerational equity concerns'] },
  { prompt: 'Governments should invest more in public transportation rather than building new roads. To what extent do you agree or disagree?', type: 'opinion', key_arguments: ['public transport reduces emissions', 'road building induces demand', 'accessibility for non-drivers', 'economic efficiency of mass transit', 'rural areas need roads'] },
  { prompt: 'Technology has made it easier to communicate but has weakened personal relationships. Do you agree or disagree?', type: 'opinion', key_arguments: ['enables long-distance connection', 'reduces face-to-face interaction quality', 'social media comparison harms wellbeing', 'technology use depends on context', 'young people particularly affected'] },
  { prompt: 'Some argue that the most important purpose of education is to prepare students for employment. Others believe education has broader goals. Discuss both views and give your own opinion.', type: 'discussion', key_arguments: ['vocational skills meet economic needs', 'education develops critical thinking', 'civic participation requires broad education', 'personal development and wellbeing', 'labour market changes unpredictably'] },
  { prompt: 'Climate change is the most serious environmental problem facing the world today. To what extent do you agree? What should be done about it?', type: 'argumentative', key_arguments: ['temperature rise threatens ecosystems', 'displacement and conflict risks', 'economic cost of inaction', 'individual vs systemic solutions', 'international cooperation required'] },
  { prompt: 'The rise of artificial intelligence will create as many jobs as it destroys. Do you agree or disagree with this statement?', type: 'opinion', key_arguments: ['historical technology created net jobs', 'AI speed of change is unprecedented', 'new industries and roles will emerge', 'retraining challenges for displaced workers', 'universal basic income as solution'] },
  { prompt: 'Mandatory national service — military or civilian — builds stronger societies. Discuss this claim with reference to specific examples.', type: 'argumentative', key_arguments: ['builds social cohesion', 'develops civic responsibility', 'restricts personal freedom', 'opportunity cost for young people', 'examples from Israel and South Korea'] },
  { prompt: 'Social media companies should be legally responsible for harmful content published on their platforms. To what extent do you agree?', type: 'opinion', key_arguments: ['platforms profit from engagement', 'freedom of speech concerns', 'technical difficulty of moderation at scale', 'existing laws may be insufficient', 'comparison with broadcast media regulation'] },
  { prompt: 'Urbanisation is largely a positive development for people and the environment. Do you agree or disagree?', type: 'opinion', key_arguments: ['economies of scale reduce per capita emissions', 'access to services and opportunities', 'cultural and intellectual innovation', 'urban sprawl and habitat loss', 'social inequality in cities'] },
];

// ── R&W FILL IN BLANKS (20) ──────────────────────────────────────────────────
const rwFIBs = [
  {
    title: 'Marine Protected Areas',
    text: 'Marine protected areas (MPAs) are ocean regions where human {{blank_0}} is restricted to allow ecosystems to recover. Research consistently shows that fish {{blank_1}} inside MPAs are higher than in surrounding waters, and that these benefits can {{blank_2}} to adjacent unprotected areas. However, enforcement remains a significant {{blank_3}}, particularly in international waters where jurisdiction is {{blank_4}}.',
    blanks: [
      { id: 0, options: ['activity', 'destruction', 'colour', 'progress'] },
      { id: 1, options: ['populations', 'directions', 'temperatures', 'colours'] },
      { id: 2, options: ['spill over', 'fall down', 'break apart', 'burn out'] },
      { id: 3, options: ['challenge', 'pleasure', 'tradition', 'culture'] },
      { id: 4, options: ['ambiguous', 'brilliant', 'motivated', 'physical'] },
    ],
    answers: [{ id: 0, word: 'activity' }, { id: 1, word: 'populations' }, { id: 2, word: 'spill over' }, { id: 3, word: 'challenge' }, { id: 4, word: 'ambiguous' }],
  },
  {
    title: 'Digital Privacy',
    text: 'The collection of personal data by technology companies has raised profound questions about {{blank_0}} and consent. Users often {{blank_1}} to terms of service without reading them, effectively surrendering extensive rights over their data. Regulators in Europe have responded with the General Data Protection {{blank_2}}, which grants individuals the right to access, correct, and delete their personal information. Critics argue, however, that enforcement {{blank_3}} have been insufficient to deter major violations, and that the fundamental {{blank_4}} model of most platforms makes meaningful privacy difficult to achieve.',
    blanks: [
      { id: 0, options: ['privacy', 'mobility', 'tradition', 'currency'] },
      { id: 1, options: ['agree', 'disagree', 'respond', 'convert'] },
      { id: 2, options: ['Regulation', 'Motivation', 'Transportation', 'Education'] },
      { id: 3, options: ['penalties', 'rewards', 'ceremonies', 'landscapes'] },
      { id: 4, options: ['advertising', 'educational', 'agricultural', 'judicial'] },
    ],
    answers: [{ id: 0, word: 'privacy' }, { id: 1, word: 'agree' }, { id: 2, word: 'Regulation' }, { id: 3, word: 'penalties' }, { id: 4, word: 'advertising' }],
  },
  {
    title: 'Cognitive Load',
    text: 'Cognitive load theory proposes that the human brain has a limited {{blank_0}} for processing new information. When the demand on this capacity {{blank_1}} its limit — a state known as cognitive overload — learning is impaired. Instructional designers use this theory to create materials that minimise extraneous load by {{blank_2}} unnecessary complexity, while maximising germane load — the mental effort that directly {{blank_3}} to schema formation. Worked examples, visual representations, and {{blank_4}} practice have all been shown to reduce cognitive load without sacrificing learning outcomes.',
    blanks: [
      { id: 0, options: ['capacity', 'colour', 'distance', 'velocity'] },
      { id: 1, options: ['exceeds', 'follows', 'creates', 'ignores'] },
      { id: 2, options: ['eliminating', 'multiplying', 'celebrating', 'delaying'] },
      { id: 3, options: ['contributes', 'disagrees', 'diminishes', 'transforms'] },
      { id: 4, options: ['spaced', 'immediate', 'random', 'difficult'] },
    ],
    answers: [{ id: 0, word: 'capacity' }, { id: 1, word: 'exceeds' }, { id: 2, word: 'eliminating' }, { id: 3, word: 'contributes' }, { id: 4, word: 'spaced' }],
  },
  {
    title: 'Soil Degradation',
    text: 'Healthy soil is one of humanity\'s most {{blank_0}} yet least appreciated resources. Modern agricultural {{blank_1}}, including heavy tillage and excessive use of synthetic fertilisers, have led to widespread soil degradation. This manifests as reduced organic matter, {{blank_2}} of beneficial microorganisms, and increased vulnerability to erosion. Regenerative agriculture {{blank_3}} practices such as cover cropping, reduced tillage, and compost {{blank_4}} to restore soil health and build carbon stocks.',
    blanks: [
      { id: 0, options: ['precious', 'colourful', 'ancient', 'distant'] },
      { id: 1, options: ['practices', 'fashions', 'elections', 'ceremonies'] },
      { id: 2, options: ['depletion', 'expansion', 'celebration', 'observation'] },
      { id: 3, options: ['employs', 'avoids', 'criticises', 'measures'] },
      { id: 4, options: ['application', 'rejection', 'calculation', 'declaration'] },
    ],
    answers: [{ id: 0, word: 'precious' }, { id: 1, word: 'practices' }, { id: 2, word: 'depletion' }, { id: 3, word: 'employs' }, { id: 4, word: 'application' }],
  },
  {
    title: 'Monetary Policy',
    text: 'Central banks use monetary policy as a primary tool for {{blank_0}} macroeconomic stability. The most common instrument is the setting of short-term interest rates, which influences the cost of {{blank_1}} for households and businesses. When inflation rises above the target {{blank_2}}, central banks typically raise rates to cool demand. Conversely, during economic {{blank_3}}, rates may be cut to stimulate investment and consumption. Since the 2008 financial crisis, many central banks have also employed {{blank_4}} easing — the purchase of assets to inject liquidity into financial markets.',
    blanks: [
      { id: 0, options: ['maintaining', 'disrupting', 'observing', 'painting'] },
      { id: 1, options: ['borrowing', 'voting', 'swimming', 'singing'] },
      { id: 2, options: ['threshold', 'tradition', 'colour', 'direction'] },
      { id: 3, options: ['downturns', 'celebrations', 'elections', 'seasons'] },
      { id: 4, options: ['quantitative', 'qualitative', 'legislative', 'comparative'] },
    ],
    answers: [{ id: 0, word: 'maintaining' }, { id: 1, word: 'borrowing' }, { id: 2, word: 'threshold' }, { id: 3, word: 'downturns' }, { id: 4, word: 'quantitative' }],
  },
];

// ── READING MCMA (10) ─────────────────────────────────────────────────────────
const readingMCMAs = [
  {
    title: 'Telomeres and Ageing',
    text: 'Telomeres are protective caps at the ends of chromosomes, analogous to the plastic tips on shoelaces that prevent fraying. Every time a cell divides, telomeres shorten slightly. When they become critically short, the cell can no longer divide and enters a state of senescence or undergoes programmed death. This process is considered a fundamental mechanism of biological ageing. Research has shown that chronic stress, poor diet, physical inactivity, and smoking accelerate telomere shortening, while regular exercise, a plant-rich diet, and mindfulness have been associated with longer telomeres. Interestingly, the enzyme telomerase can lengthen telomeres, but its uncontrolled activation is associated with cancer.',
    question: 'Which of the following are supported by the passage?',
    options: [
      { id: 'A', text: 'Telomeres shorten with each cell division.' },
      { id: 'B', text: 'Telomerase activation is always beneficial to health.' },
      { id: 'C', text: 'Exercise and diet can influence telomere length.' },
      { id: 'D', text: 'Cell senescence occurs when telomeres become critically short.' },
      { id: 'E', text: 'Ageing is caused exclusively by telomere shortening.' },
    ],
    correct: ['A', 'C', 'D'],
  },
  {
    title: 'Smart Cities',
    text: 'Smart cities integrate digital technology and data analytics into urban infrastructure to improve efficiency, sustainability, and quality of life for residents. Sensors embedded throughout the city monitor traffic flow, air quality, energy consumption, and waste levels, feeding data into centralised management systems. Proponents argue that smart city technologies can reduce traffic congestion, lower carbon emissions, optimise public service delivery, and enable more responsive governance. Critics, however, raise concerns about data privacy — as cities collect detailed information about residents\' movements and behaviours — and the risk of creating technological systems so complex they become fragile. There are also equity concerns: smart city benefits may accrue primarily to wealthy areas, exacerbating existing urban inequalities.',
    question: 'According to the passage, which of the following are identified as concerns about smart cities?',
    options: [
      { id: 'A', text: 'Data privacy risks from monitoring residents.' },
      { id: 'B', text: 'Difficulty of installing sensors in buildings.' },
      { id: 'C', text: 'Potential for increased urban inequality.' },
      { id: 'D', text: 'Increased traffic congestion.' },
      { id: 'E', text: 'Fragility of highly complex systems.' },
    ],
    correct: ['A', 'C', 'E'],
  },
  {
    title: 'Crowdfunding',
    text: 'Crowdfunding platforms enable entrepreneurs, artists, and community organisations to raise capital from a large number of small contributors online. The model has several distinct forms: reward-based crowdfunding offers backers products or experiences in return for pledges; equity crowdfunding allows contributors to purchase small ownership stakes in early-stage companies; and donation-based crowdfunding supports charitable causes without expectation of financial return. The rise of crowdfunding has democratised access to capital, allowing ventures to bypass traditional financial gatekeepers such as banks and venture capital firms. However, the model has limitations: successful campaigns require significant marketing effort, platforms charge substantial fees, and backers have limited legal protections if projects fail to deliver.',
    question: 'Which of the following statements about crowdfunding are correct according to the passage?',
    options: [
      { id: 'A', text: 'Equity crowdfunding gives contributors partial ownership.' },
      { id: 'B', text: 'Crowdfunding guarantees success for all campaigns.' },
      { id: 'C', text: 'Reward crowdfunding offers products in return for pledges.' },
      { id: 'D', text: 'Platforms charge fees for hosting campaigns.' },
      { id: 'E', text: 'Backers have strong legal protection if a project fails.' },
    ],
    correct: ['A', 'C', 'D'],
  },
];

// ── READING REORDER (15) ──────────────────────────────────────────────────────
const reorderSets = [
  {
    title: 'The Scientific Method',
    answer_order: ['B', 'D', 'A', 'C', 'E'],
    paragraphs: [
      { id: 'A', text: 'Based on these observations, the researcher formulates a hypothesis — a testable prediction about how or why the phenomenon occurs.' },
      { id: 'B', text: 'The scientific method begins with observation: a researcher notices a phenomenon that requires explanation.' },
      { id: 'C', text: 'The experiment is then designed to test this hypothesis, with careful attention given to controlling for variables that might otherwise confound the results.' },
      { id: 'D', text: 'A review of existing literature helps establish what is already known and identifies gaps that the current investigation might address.' },
      { id: 'E', text: 'Finally, the results are analysed and communicated to the scientific community through peer-reviewed publication, where they are subject to scrutiny and replication.' },
    ],
  },
  {
    title: 'Industrial Revolution Causes',
    answer_order: ['C', 'A', 'D', 'B', 'E'],
    paragraphs: [
      { id: 'A', text: 'Britain\'s strong property rights and patent system gave inventors an incentive to develop and protect new technologies.' },
      { id: 'B', text: 'The canal and later railway network provided the transport infrastructure necessary to move raw materials to factories and finished goods to markets.' },
      { id: 'C', text: 'Several structural factors made Britain the birthplace of the Industrial Revolution in the late eighteenth century.' },
      { id: 'D', text: 'Abundant coal and iron deposits provided the fuel and raw materials that powered steam engines and machinery.' },
      { id: 'E', text: 'Together, these factors created a uniquely favourable environment in which technological innovation could transform an agricultural society into an industrial one.' },
    ],
  },
  {
    title: 'Vaccine Mechanism',
    answer_order: ['D', 'B', 'A', 'E', 'C'],
    paragraphs: [
      { id: 'A', text: 'The immune system mounts a response, producing antibodies and activating memory cells specifically targeted at the pathogen.' },
      { id: 'B', text: 'The vaccine introduces a harmless version of the pathogen — or a fragment of it — into the body.' },
      { id: 'C', text: 'This rapid secondary response prevents the disease from developing, or greatly reduces its severity.' },
      { id: 'D', text: 'Vaccination works by training the immune system to recognise and respond to specific pathogens.' },
      { id: 'E', text: 'If the vaccinated person later encounters the actual pathogen, their immune system recognises it immediately and responds much more quickly than it would without prior exposure.' },
    ],
  },
  {
    title: 'Carbon Trading',
    answer_order: ['A', 'C', 'E', 'B', 'D'],
    paragraphs: [
      { id: 'A', text: 'Emissions trading schemes, commonly known as cap-and-trade systems, are a market-based approach to reducing greenhouse gas emissions.' },
      { id: 'B', text: 'Companies that can reduce emissions cheaply will do so and sell their surplus permits, while those for which reduction is costly will buy permits instead.' },
      { id: 'C', text: 'A regulatory authority sets a cap on total emissions and distributes or auctions a limited number of permits to emit.' },
      { id: 'D', text: 'Proponents argue this achieves emission reductions at the lowest possible cost, while critics note that volatile permit prices can undermine long-term investment decisions.' },
      { id: 'E', text: 'Firms must hold enough permits to cover their emissions or face penalties, creating a financial incentive to reduce.' },
    ],
  },
  {
    title: 'Reading Development in Children',
    answer_order: ['C', 'A', 'D', 'B', 'E'],
    paragraphs: [
      { id: 'A', text: 'Phonemic awareness — the understanding that spoken words are composed of individual sounds — is considered a foundational prerequisite for reading success.' },
      { id: 'B', text: 'Once decoding is automatic, cognitive resources are freed for comprehension — understanding the meaning of text.' },
      { id: 'C', text: 'Learning to read is one of the most complex cognitive achievements of early childhood, requiring the integration of multiple skills.' },
      { id: 'D', text: 'Phonics instruction teaches children to decode words by connecting letters and letter combinations to their corresponding sounds.' },
      { id: 'E', text: 'Fluent readers who comprehend well draw on vocabulary knowledge, background knowledge, and inference skills to construct meaning from complex texts.' },
    ],
  },
];

// ── READING FILL BLANKS (15) ─────────────────────────────────────────────────
const readingFIBs = [
  {
    title: 'Memory Types',
    text: 'Psychologists distinguish between {{blank_0}} memory, which stores facts and events, and {{blank_1}} memory, which encodes skills and procedures. Episodic memory — a {{blank_2}} of declarative memory — allows us to mentally travel back in time and re-experience personal events. The hippocampus plays a central role in forming new declarative memories, as demonstrated by patients with hippocampal {{blank_3}} who cannot {{blank_4}} new facts but retain previously learned skills.',
    word_bank: ['declarative', 'procedural', 'form', 'subset', 'damage', 'extend', 'implicit', 'abstract'],
    answers: [{ id: 0, word: 'declarative' }, { id: 1, word: 'procedural' }, { id: 2, word: 'subset' }, { id: 3, word: 'damage' }, { id: 4, word: 'form' }],
  },
  {
    title: 'Monetary Inflation',
    text: 'Inflation refers to the general {{blank_0}} in the price level of goods and services over time. When inflation is high, the purchasing {{blank_1}} of money falls, eroding savings and affecting living standards. Central banks typically manage inflation by {{blank_2}} interest rates. Higher interest rates increase the cost of borrowing, which tends to {{blank_3}} consumer spending and business investment, reducing {{blank_4}} pressures.',
    word_bank: ['rise', 'power', 'adjusting', 'reduce', 'inflationary', 'fall', 'legal', 'traditional'],
    answers: [{ id: 0, word: 'rise' }, { id: 1, word: 'power' }, { id: 2, word: 'adjusting' }, { id: 3, word: 'reduce' }, { id: 4, word: 'inflationary' }],
  },
  {
    title: 'Tectonic Plates',
    text: 'The Earth\'s outer shell, the {{blank_0}}, is divided into large {{blank_1}} known as tectonic plates. These plates move slowly over the more {{blank_2}} material of the upper mantle. Where plates converge, one may be forced beneath the other in a process called {{blank_3}}, often generating earthquakes and {{blank_4}} eruptions.',
    word_bank: ['lithosphere', 'fragments', 'fluid', 'subduction', 'volcanic', 'convection', 'seismic', 'glacial'],
    answers: [{ id: 0, word: 'lithosphere' }, { id: 1, word: 'fragments' }, { id: 2, word: 'fluid' }, { id: 3, word: 'subduction' }, { id: 4, word: 'volcanic' }],
  },
];

// ── READING MCSA (10) ─────────────────────────────────────────────────────────
const readingMCSAs = [
  {
    title: 'The Gig Economy',
    text: 'The gig economy encompasses short-term, flexible working arrangements typically mediated by digital platforms. Workers in this model — including ride-share drivers, food delivery couriers, and freelance designers — are generally classified as independent contractors rather than employees. This classification allows platform companies to avoid providing benefits such as sick leave, superannuation, and workers\' compensation insurance. Proponents of the gig economy argue that it offers workers unprecedented flexibility and allows them to supplement income from other sources. However, labour rights advocates contend that many gig workers have little genuine choice about when and how much they work, and that the economic risks of the arrangement — fluctuating income, equipment costs, and lack of safety net — fall entirely on the individual.',
    question: 'What is the main argument made by critics of the gig economy?',
    options: [
      { id: 'A', text: 'Digital platforms are too expensive to use.' },
      { id: 'B', text: 'Gig workers bear economic risks with little genuine flexibility.' },
      { id: 'C', text: 'The gig economy reduces total employment levels.' },
      { id: 'D', text: 'Independent contractors earn more than employees.' },
    ],
    correct: 'B',
  },
  {
    title: 'Urban Noise Pollution',
    text: 'Noise pollution is increasingly recognised as a significant public health issue in urban environments. Prolonged exposure to high noise levels — from traffic, construction, and nightlife — has been linked to elevated blood pressure, sleep disturbance, cognitive impairment in children, and increased risk of cardiovascular disease. The World Health Organisation estimates that at least one million healthy years of life are lost each year in Western Europe alone due to traffic noise. Urban planners are responding with a range of interventions, including noise barriers along major roads, low-noise road surfaces, zoning restrictions that separate industrial and residential land uses, and the creation of quiet green spaces within cities.',
    question: 'According to the passage, what is the World Health Organisation\'s estimate regarding noise in Western Europe?',
    options: [
      { id: 'A', text: 'One million people are permanently deaf due to noise.' },
      { id: 'B', text: 'Noise pollution costs one billion euros annually.' },
      { id: 'C', text: 'At least one million healthy life years are lost annually due to traffic noise.' },
      { id: 'D', text: 'One million quiet zones need to be created.' },
    ],
    correct: 'C',
  },
  {
    title: 'Deep Sea Exploration',
    text: 'Despite covering more than seventy percent of Earth\'s surface, the deep ocean remains one of the least explored environments on the planet. Extreme pressure, near-freezing temperatures, and complete darkness make exploration both technically demanding and expensive. Yet the deep sea harbours remarkable biodiversity, including chemosynthetic ecosystems around hydrothermal vents that derive energy from chemical reactions rather than sunlight. These communities have challenged fundamental assumptions about where life can exist and have prompted speculation about the possibility of life in similar environments elsewhere in the solar system, such as the subsurface oceans of Europa and Enceladus.',
    question: 'Why do hydrothermal vent communities challenge existing assumptions?',
    options: [
      { id: 'A', text: 'They prove that the deep ocean is too hot for life.' },
      { id: 'B', text: 'They demonstrate that life can exist without sunlight-based energy.' },
      { id: 'C', text: 'They show that deep sea exploration is unnecessary.' },
      { id: 'D', text: 'They reveal that deep sea creatures need extreme heat.' },
    ],
    correct: 'B',
  },
];

// ── LISTENING SUMMARIZE (12) ──────────────────────────────────────────────────
const listeningSSTs = [
  {
    title: 'The Psychology of Decision Making',
    audio: 'Today we will examine how human beings make decisions. Contrary to the classical economic model of the rational agent, research by Daniel Kahneman and Amos Tversky revealed that people rely on mental shortcuts called heuristics that can lead to predictable errors. One powerful example is anchoring: people tend to rely heavily on the first number they encounter when making judgements, even when that number is arbitrary. In one study, participants who were first shown a high number estimated the African nations in the United Nations to be much higher than those shown a low number. This has important implications in fields ranging from negotiation to medical diagnosis, where anchoring on an initial reading or test result can distort clinical judgement.',
    key_points: ['Humans use heuristics that cause predictable errors', 'Anchoring bias makes people rely on first numbers seen', 'Applies to negotiation and medical diagnosis'],
    sample: 'Research shows that humans use mental shortcuts like anchoring — the tendency to rely on initial numbers — which leads to predictable decision-making errors with important implications in negotiation and medical fields.',
  },
  {
    title: 'Coral Bleaching',
    audio: 'Coral bleaching occurs when sea temperatures rise above normal levels, causing corals to expel the photosynthetic algae — called zooxanthellae — that live symbiotically within their tissues. These algae provide corals with up to ninety percent of their energy requirements through photosynthesis, and also give corals their distinctive colours. Without their algal partners, corals turn white — hence the term bleaching — and face starvation. If temperatures return to normal quickly, corals can recover, but prolonged thermal stress leads to mortality. Mass bleaching events have become more frequent and severe due to climate change. The Great Barrier Reef experienced five mass bleaching events between 2016 and 2024, threatening the long-term viability of the world\'s largest coral reef ecosystem.',
    key_points: ['Coral bleaching caused by thermal stress expelling algae', 'Algae provide 90% of coral energy', 'Mass bleaching events increasing due to climate change'],
    sample: 'Coral bleaching, caused by elevated sea temperatures expelling the algae that provide corals up to 90% of their energy, has become more frequent due to climate change, threatening reef ecosystems globally.',
  },
  {
    title: 'Universal Basic Income',
    audio: 'Universal basic income, or UBI, is a policy proposal under which every adult citizen receives a regular, unconditional cash payment from the government, regardless of their employment status or income level. Proponents argue that UBI would eliminate poverty, simplify the welfare system, provide economic security during career transitions, and prepare society for automation-driven job displacement. Pilot programs have been conducted in Finland, Kenya, and Stockton, California. Results from Finland showed that recipients reported significantly higher wellbeing and mental health scores, with no reduction in employment. Critics, however, raise concerns about cost — financing a meaningful UBI would require either substantial tax increases or reductions in other spending — and about inflation risks if purchasing power increases without a corresponding rise in productive capacity.',
    key_points: ['UBI provides unconditional cash payments to all citizens', 'Finland pilot showed higher wellbeing with no employment reduction', 'Concerns include cost and potential inflation'],
    sample: 'Universal basic income proposes unconditional payments to all citizens, with pilot programs showing improved wellbeing but no employment reduction; however, critics highlight significant concerns about financing costs and inflationary effects.',
  },
];

// ── LISTENING MCMA (10) ──────────────────────────────────────────────────────
const listeningMCMAs = [
  {
    title: 'Renewable Energy Challenges',
    audio: 'The transition to renewable energy presents several important engineering and economic challenges. First, wind and solar power are intermittent — they only generate electricity when the wind blows or the sun shines. This means grid operators must either have backup dispatchable generation available or find ways to store electricity. Battery storage has advanced rapidly, but storing energy at the scale required for national grids remains expensive. Second, existing grid infrastructure was designed for centralised power generation and must be upgraded to handle distributed generation from thousands of smaller sources. Third, the manufacturing of solar panels and wind turbines requires rare earth metals, the mining of which has significant environmental impacts.',
    question: 'According to the recording, what challenges does the energy transition face?',
    options: [
      { id: 'A', text: 'Solar and wind are intermittent energy sources.' },
      { id: 'B', text: 'Renewable energy is more expensive than coal in all markets.' },
      { id: 'C', text: 'Grid infrastructure needs upgrading for distributed generation.' },
      { id: 'D', text: 'Manufacturing renewables requires rare earth metals.' },
      { id: 'E', text: 'Battery technology has made no progress in recent years.' },
    ],
    correct: ['A', 'C', 'D'],
  },
  {
    title: 'Learning Strategies',
    audio: 'Educational researchers have identified several study strategies that are highly effective, and others that students commonly use but which provide little benefit. Retrieval practice — the act of recalling information from memory, such as through self-testing or practice exams — consistently produces better long-term retention than re-reading notes or highlighting text. Spaced repetition, which involves revisiting material at increasing intervals over time, is similarly effective. By contrast, blocked practice — studying one subject intensively before moving to another — tends to produce impressive short-term performance but poor long-term retention, a phenomenon called the illusion of fluency. Students who use interleaved practice, mixing up different types of problems in a single study session, show better transfer of knowledge to new situations.',
    question: 'Which study methods does the speaker identify as effective?',
    options: [
      { id: 'A', text: 'Highlighting and underlining text.' },
      { id: 'B', text: 'Retrieval practice through self-testing.' },
      { id: 'C', text: 'Spaced repetition of material.' },
      { id: 'D', text: 'Blocked practice on single subjects.' },
      { id: 'E', text: 'Interleaved practice mixing different problems.' },
    ],
    correct: ['B', 'C', 'E'],
  },
];

// ── LISTENING FILL BLANKS (15) ───────────────────────────────────────────────
const listeningFIBs = [
  {
    title: 'The Human Digestive System',
    audio: 'The digestive system breaks food down into nutrients that the body can absorb and use. The process begins in the mouth, where chewing and saliva initiate the breakdown of carbohydrates. Food then passes through the oesophagus into the stomach, where acid and enzymes continue digestion. The small intestine is where most nutrient absorption takes place, aided by bile from the liver and enzymes from the pancreas. The large intestine absorbs water and passes waste for elimination.',
    transcript: 'The digestive system breaks food down into {{blank_0}} that the body can absorb and use. The process begins in the mouth, where chewing and saliva initiate the breakdown of carbohydrates. Food then passes through the oesophagus into the stomach, where acid and {{blank_1}} continue digestion. The small intestine is where most {{blank_2}} absorption takes place, aided by bile from the liver and enzymes from the {{blank_3}}. The large intestine absorbs {{blank_4}} and passes waste for elimination.',
    answers: [{ id: 0, word: 'nutrients' }, { id: 1, word: 'enzymes' }, { id: 2, word: 'nutrient' }, { id: 3, word: 'pancreas' }, { id: 4, word: 'water' }],
  },
  {
    title: 'Climate Feedback Loops',
    audio: 'Climate feedback loops are processes that amplify or dampen the effects of climate change. Positive feedback loops accelerate warming: as Arctic ice melts, the darker ocean surface exposed absorbs more heat than the reflective ice did, causing further warming and more melting. The permafrost thaw feedback is particularly concerning: as frozen ground melts, organic matter decomposes and releases methane, a powerful greenhouse gas, which causes further warming. Negative feedback loops act as brakes: increased water vapour from warming leads to more cloud cover, which can reflect sunlight and reduce warming.',
    transcript: 'Climate {{blank_0}} loops are processes that amplify or dampen the effects of climate change. Positive feedback loops {{blank_1}} warming. As Arctic ice melts, the darker ocean surface absorbs more heat, causing further warming and more melting. The permafrost thaw feedback releases {{blank_2}}, a powerful greenhouse gas. Negative feedback loops act as {{blank_3}}: increased water vapour leads to more cloud cover, which can {{blank_4}} sunlight and reduce warming.',
    answers: [{ id: 0, word: 'feedback' }, { id: 1, word: 'accelerate' }, { id: 2, word: 'methane' }, { id: 3, word: 'brakes' }, { id: 4, word: 'reflect' }],
  },
  {
    title: 'The Silk Road',
    audio: 'The Silk Road was not a single road but a network of trade routes connecting China and Central Asia to the Mediterranean world. Active for over a thousand years, it facilitated the exchange not only of goods — silk, spices, porcelain, glassware, and precious metals — but also of ideas, religions, technologies, and diseases. Buddhism spread from India to China along Silk Road routes, while Islam later spread in the opposite direction. The bubonic plague is believed to have travelled westward along these routes in the fourteenth century, devastating populations across Eurasia.',
    transcript: 'The Silk Road was a {{blank_0}} of trade routes connecting China and Central Asia to the Mediterranean. It facilitated exchange of goods and also of ideas, {{blank_1}}, technologies, and diseases. {{blank_2}} spread from India to China, while Islam spread in the opposite direction. The {{blank_3}} plague is believed to have travelled westward along these routes in the fourteenth century, devastating {{blank_4}} across Eurasia.',
    answers: [{ id: 0, word: 'network' }, { id: 1, word: 'religions' }, { id: 2, word: 'Buddhism' }, { id: 3, word: 'bubonic' }, { id: 4, word: 'populations' }],
  },
];

// ── HIGHLIGHT CORRECT SUMMARY (10) ──────────────────────────────────────────
const listeningHCSs = [
  {
    title: 'The Sharing Economy',
    audio: 'The sharing economy refers to a system where individuals share access to goods and services, often facilitated by digital platforms. The best-known examples are ride-sharing services and accommodation platforms. Proponents argue the sharing economy increases the efficiency of resource use — a car that sits idle most of the day can instead transport multiple passengers. Critics, however, point out that many sharing economy companies are not really about sharing at all but are commercial enterprises that shift economic risk onto workers and avoid the regulatory costs faced by traditional businesses.',
    options: [
      { id: 'A', text: 'The sharing economy is universally beneficial and improves resource efficiency while creating fair jobs for workers.' },
      { id: 'B', text: 'The sharing economy, enabled by digital platforms, can improve resource efficiency but is criticised for shifting risk to workers and avoiding regulation.' },
      { id: 'C', text: 'The sharing economy is primarily about accommodation platforms and has had no significant impact on employment.' },
      { id: 'D', text: 'The sharing economy was invented by economists to describe traditional markets where goods are exchanged.' },
    ],
    correct: 'B',
  },
  {
    title: 'Epigenetics',
    audio: 'Epigenetics is the study of changes in gene expression that do not involve alterations to the DNA sequence itself. Environmental factors — including diet, stress, and exposure to toxins — can add or remove chemical markers to DNA or the proteins around which it is wound, switching genes on or off. Crucially, some of these epigenetic modifications can be passed from parents to offspring, suggesting that acquired characteristics may in certain circumstances be heritable. This challenges the strict gene-centred view of inheritance and has generated both excitement and controversy in the biological sciences.',
    options: [
      { id: 'A', text: 'Epigenetics involves permanent changes to the DNA sequence caused by environmental factors.' },
      { id: 'B', text: 'Epigenetics shows that all human traits are determined by genes inherited from parents.' },
      { id: 'C', text: 'Epigenetics examines how environmental factors change gene expression without altering DNA, with some changes potentially heritable.' },
      { id: 'D', text: 'Epigenetic research has conclusively proven that stress is the primary cause of all genetic mutations.' },
    ],
    correct: 'C',
  },
];

// ── LISTENING MCSA (10) ──────────────────────────────────────────────────────
const listeningMCSAs = [
  {
    title: 'Microfinance',
    audio: 'Microfinance programmes provide small loans and financial services to low-income individuals who lack access to conventional banking. The model was popularised by Muhammad Yunus, who founded the Grameen Bank in Bangladesh in 1983. The premise is that access to credit enables poor entrepreneurs to invest in productive assets, increase their income, and gradually escape poverty. Grameen Bank achieved loan repayment rates of over ninety percent, disproving the assumption that lending to the poor was too risky. However, critics have noted that some microfinance programmes have charged very high interest rates and that evidence of long-term poverty reduction is less robust than early advocates claimed.',
    question: 'What was significant about the Grameen Bank\'s repayment rates?',
    options: [
      { id: 'A', text: 'They showed that poor borrowers are unreliable.' },
      { id: 'B', text: 'They proved that lending to the poor could be viable.' },
      { id: 'C', text: 'They were used to justify high interest rates.' },
      { id: 'D', text: 'They were lower than rates at conventional banks.' },
    ],
    correct: 'B',
  },
  {
    title: 'The Blue Economy',
    audio: 'The blue economy encompasses all economic activities related to ocean resources — fisheries, aquaculture, maritime transport, offshore energy, and marine tourism. The ocean economy is estimated to be worth over two trillion dollars annually and supports the livelihoods of hundreds of millions of people globally. However, many ocean industries operate in ways that are degrading the very ecosystems on which they depend. Overfishing has reduced fish stocks to critical levels, while pollution, coastal development, and climate change threaten marine biodiversity. Advocates of a sustainable blue economy argue that conservation and economic development are not mutually exclusive and that investing in ocean health generates long-term economic returns.',
    question: 'What is the main argument of blue economy advocates?',
    options: [
      { id: 'A', text: 'Ocean industries should reduce their economic activities.' },
      { id: 'B', text: 'Marine tourism should be the primary focus of ocean economies.' },
      { id: 'C', text: 'Conservation and economic development in ocean industries can be compatible.' },
      { id: 'D', text: 'All fishing should be banned to protect marine ecosystems.' },
    ],
    correct: 'C',
  },
];

// ── SELECT MISSING WORD (10) ─────────────────────────────────────────────────
const listeningSMWs = [
  { audio: 'The primary driver of food price inflation in recent years has been a combination of supply chain disruptions, extreme weather events affecting harvests, and rising energy costs — all of which have been exacerbated by [BEEP]', options: ['geopolitical instability', 'agricultural innovation', 'consumer preferences', 'trade liberalisation'], correct: 'geopolitical instability' },
  { audio: 'Researchers found that participants who exercised regularly showed significantly better performance on memory tests, suggesting a strong link between physical activity and [BEEP]', options: ['cardiovascular health', 'cognitive function', 'social behaviour', 'dietary choices'], correct: 'cognitive function' },
  { audio: 'The government announced a new initiative to expand access to mental health services in rural areas, recognising that geographic isolation is a major barrier to [BEEP]', options: ['economic growth', 'mental health care', 'physical fitness', 'agricultural production'], correct: 'mental health care' },
  { audio: 'Scientists studying ice cores from Antarctica have been able to reconstruct historical climate conditions going back hundreds of thousands of years, providing crucial insights into natural patterns of [BEEP]', options: ['human migration', 'cultural change', 'climate variability', 'ocean acidification'], correct: 'climate variability' },
  { audio: 'The report concluded that reducing single-use plastic will require not just individual behaviour change but systemic reform of how products are designed, manufactured, and [BEEP]', options: ['marketed to consumers', 'exported internationally', 'taxed by governments', 'disposed of or recycled'], correct: 'disposed of or recycled' },
];

// ── HIGHLIGHT INCORRECT WORDS (15) ──────────────────────────────────────────
const listeningHIWs = [
  {
    title: 'Photosynthesis Process',
    audio: 'Plants use sunlight, water, and carbon dioxide to produce glucose and oxygen through a process called photosynthesis. This reaction takes place in the chloroplasts of plant cells, which contain a green pigment called chlorophyll. Photosynthesis is the foundation of almost all life on Earth, as it converts solar energy into a chemical form that can be used by living organisms.',
    transcript: 'Plants use sunlight, water, and carbon dioxide to produce glucose and nitrogen through a process called photosynthesis. This reaction takes place in the mitochondria of plant cells, which contain a green pigment called chlorophyll. Photosynthesis is the foundation of almost all life on Earth, as it converts solar energy into a chemical form that can be used by living organisms.',
    incorrect_words: ['nitrogen', 'mitochondria'],
  },
  {
    title: 'The Water Cycle',
    audio: 'The water cycle describes the continuous movement of water through the Earth\'s systems. Water evaporates from the ocean and land surfaces, rises into the atmosphere as water vapour, and condenses to form clouds. Precipitation in the form of rain or snow returns water to the surface, where it either flows into rivers and lakes or infiltrates the soil to replenish groundwater reserves.',
    transcript: 'The water cycle describes the continuous movement of water through the Earth\'s systems. Water evaporates from the ocean and land surfaces, rises into the atmosphere as water vapour, and condenses to form clouds. Precipitation in the form of rain or snow returns water to the surface, where it either flows into rivers and lakes or infiltrates the soil to replenish underground reserves.',
    incorrect_words: ['underground'],
  },
  {
    title: 'Supply and Demand',
    audio: 'The law of supply and demand is one of the most fundamental principles in economics. When demand for a product increases and supply remains constant, prices will rise. Conversely, when supply increases and demand remains unchanged, prices will fall. This mechanism acts as a signal to producers and consumers, coordinating economic activity without central direction.',
    transcript: 'The law of supply and demand is one of the most fundamental principles in economics. When demand for a product increases and supply remains fixed, prices will rise. Conversely, when supply increases and demand remains unchanged, prices will fall. This mechanism acts as a signal to producers and consumers, coordinating economic activity without central direction.',
    incorrect_words: ['fixed'],
  },
];

// ── WRITE FROM DICTATION (25) ────────────────────────────────────────────────
const wfdSentences = [
  'The results of the study suggest a significant relationship between diet and cognitive decline.',
  'Students are required to submit all assignments through the online learning management system.',
  'The committee reviewed the proposal and approved it with minor modifications.',
  'Climate change is projected to have severe consequences for agriculture in tropical regions.',
  'The university offers a range of scholarships for domestic and international students.',
  'Increasing biodiversity in agricultural landscapes can reduce the need for chemical pesticides.',
  'The professor asked the students to read chapter five before the next lecture.',
  'Recent advances in battery technology have significantly reduced the cost of electric vehicles.',
  'The government introduced new legislation to improve workplace safety standards.',
  'Researchers have found that regular physical exercise reduces the risk of depression.',
  'The library provides access to thousands of academic journals and electronic databases.',
  'Urban areas are experiencing rapid population growth due to economic migration from rural regions.',
  'The experiment demonstrated that temperature has a significant effect on enzyme activity.',
  'International students must obtain a valid visa before commencing their studies.',
  'The researchers concluded that further investigation is necessary to confirm these findings.',
  'Air pollution in major cities has been linked to increased rates of respiratory disease.',
  'The essay must include a clear thesis statement and be supported by relevant evidence.',
  'Globalisation has accelerated the transfer of technology between developed and developing nations.',
  'The patient was prescribed a course of antibiotics and advised to rest for one week.',
  'Economic inequality has widened significantly in many countries over the past three decades.',
  'All participants were required to sign an informed consent form prior to the study.',
  'The construction of the new bridge will reduce traffic congestion in the city centre.',
  'Scientists believe that the universe began approximately thirteen point eight billion years ago.',
  'The conference will bring together leading experts from across the fields of medicine and public health.',
  'Deforestation is one of the primary drivers of biodiversity loss in tropical ecosystems.',
];

// ════════════════════════════════════════════════════════════════════════════
// BUILD TESTS — assign questions to each test
// ════════════════════════════════════════════════════════════════════════════

function buildFullMock(testId, mockIndex) {
  let order = 1;
  const ra = readAloudPassages;
  const rs = repeatSentences;
  const di = describeImages;
  const rl = retellLectures;
  const asq = answerShortQs;
  const swt = swtPassages;
  const ep = essayPrompts;
  const rwf = rwFIBs;
  const rmcma = readingMCMAs;
  const reo = reorderSets;
  const rfib = readingFIBs;
  const rmcsa = readingMCSAs;
  const sst = listeningSSTs;
  const lmcma = listeningMCMAs;
  const lfib = listeningFIBs;
  const hcs = listeningHCSs;
  const lmcsa = listeningMCSAs;
  const smw = listeningSMWs;
  const hiw = listeningHIWs;
  const wfd = wfdSentences;

  const i = mockIndex;

  // SPEAKING
  // 6 read aloud
  for (let k = 0; k < 6; k++) {
    const p = ra[(i * 6 + k) % ra.length];
    addQ(testId, 'speaking', 'speaking_read_aloud', order++, p.title,
      { text: p.text }, { text: p.text },
      { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, null, 35);
  }

  // 10 repeat sentence
  for (let k = 0; k < 10; k++) {
    const s = rs[(i * 10 + k) % rs.length];
    addQ(testId, 'speaking', 'speaking_repeat_sentence', order++, `Repeat Sentence ${order - 1}`,
      { audio_text: s }, { text: s },
      { content: 3, oral_fluency: 3, pronunciation: 3 }, 9, s, 15);
  }

  // 3 describe image
  for (let k = 0; k < 3; k++) {
    const d = di[(i * 3 + k) % di.length];
    addQ(testId, 'speaking', 'speaking_describe_image', order++, d.title,
      { image_type: d.image_type, description: d.description, data: d.data },
      { key_points: d.key_points },
      { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, null, 40);
  }

  // 1 retell lecture
  const rlItem = rl[i % rl.length];
  addQ(testId, 'speaking', 'speaking_retell_lecture', order++, rlItem.title,
    { lecture_text: rlItem.lecture, topic: rlItem.topic },
    { key_points: rlItem.key_points },
    { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, rlItem.lecture, 40);

  // 10 answer short
  for (let k = 0; k < 10; k++) {
    const q = asq[(i * 10 + k) % asq.length];
    addQ(testId, 'speaking', 'speaking_answer_short', order++, `Answer Short Question ${order - 1}`,
      { question: q.q }, { text: q.a, alternatives: q.alts },
      { pronunciation: 3 }, 3, q.q, 10);
  }

  // WRITING
  const swtItem = swt[i % swt.length];
  addQ(testId, 'writing', 'writing_summarize_text', order++, swtItem.title,
    { text: swtItem.text }, { sample: swtItem.sample, key_points: swtItem.key_points },
    { content: 2, form: 1, grammar: 2, vocabulary: 2, spelling: 2 }, 9, null, 600);

  const essayItem = ep[i % ep.length];
  addQ(testId, 'writing', 'writing_essay', order++, 'Write Essay',
    { prompt: essayItem.prompt, type: essayItem.type },
    { sample_outline: '', key_arguments: essayItem.key_arguments },
    { content: 3, form: 2, grammar: 2, vocabulary: 2, spelling: 2, cohesion: 2 }, 13, null, 1200);

  // READING
  // 5 rw fill blanks
  for (let k = 0; k < Math.min(5, rwf.length); k++) {
    const r = rwf[(i * 5 + k) % rwf.length];
    addQ(testId, 'reading', 'reading_rw_fill_blanks', order++, r.title,
      { text: r.text.replace(/\{\{blank_(\d+)\}\}/g, (m, n) => `{{blank_${n}}}`), blanks: r.blanks },
      { answers: r.answers },
      { per_blank: 1 }, r.answers.length, null, 120);
  }

  // 1 mcma reading
  const rm = rmcma[i % rmcma.length];
  addQ(testId, 'reading', 'reading_mcma', order++, rm.title,
    { text: rm.text, question: rm.question, options: rm.options },
    { correct: rm.correct },
    { partial: true, per_correct: 1, per_wrong: -1 }, rm.correct.length, null, 120);

  // 2 reorder
  for (let k = 0; k < 2; k++) {
    const r = reo[(i * 2 + k) % reo.length];
    addQ(testId, 'reading', 'reading_reorder', order++, r.title,
      { paragraphs: [...r.paragraphs].sort(() => Math.random() - 0.5) },
      { order: r.answer_order },
      { partial: true }, r.answer_order.length - 1, null, 120);
  }

  // 4 reading fill blanks
  for (let k = 0; k < Math.min(4, rfib.length); k++) {
    const r = rfib[(i * 4 + k) % rfib.length];
    addQ(testId, 'reading', 'reading_fill_blanks', order++, r.title,
      { text: r.text, word_bank: r.word_bank },
      { answers: r.answers },
      { per_blank: 1 }, r.answers.length, null, 120);
  }

  // 1 reading mcsa
  const rmc = rmcsa[i % rmcsa.length];
  addQ(testId, 'reading', 'reading_mcsa', order++, rmc.title,
    { text: rmc.text, question: rmc.question, options: rmc.options },
    { correct: rmc.correct },
    { total: 1 }, 1, null, 120);

  // LISTENING
  // 2 summarize spoken
  for (let k = 0; k < Math.min(2, sst.length); k++) {
    const s = sst[(i * 2 + k) % sst.length];
    addQ(testId, 'listening', 'listening_summarize', order++, s.title,
      { topic: s.title, duration: 60 },
      { sample: s.sample, key_points: s.key_points },
      { content: 2, form: 1, grammar: 2, vocabulary: 2, spelling: 2 }, 9, s.audio, 600);
  }

  // 1 listening mcma
  const lm = lmcma[i % lmcma.length];
  addQ(testId, 'listening', 'listening_mcma', order++, lm.title,
    { question: lm.question, options: lm.options },
    { correct: lm.correct },
    { partial: true, per_correct: 1, per_wrong: -1 }, lm.correct.length, lm.audio, 120);

  // 2 listening fill blanks
  for (let k = 0; k < Math.min(2, lfib.length); k++) {
    const l = lfib[(i * 2 + k) % lfib.length];
    addQ(testId, 'listening', 'listening_fill_blanks', order++, l.title,
      { text: l.transcript },
      { answers: l.answers },
      { per_blank: 1 }, l.answers.length, l.audio, 120);
  }

  // 1 highlight correct summary
  const h = hcs[i % hcs.length];
  addQ(testId, 'listening', 'listening_highlight_summary', order++, h.title,
    { options: h.options },
    { correct: h.correct },
    { total: 1 }, 1, h.audio, 60);

  // 1 listening mcsa
  const lmc = lmcsa[i % lmcsa.length];
  addQ(testId, 'listening', 'listening_mcsa', order++, lmc.title,
    { question: lmc.question, options: lmc.options },
    { correct: lmc.correct },
    { total: 1 }, 1, lmc.audio, 60);

  // 1 select missing word
  const sw = smw[i % smw.length];
  addQ(testId, 'listening', 'listening_missing_word', order++, 'Select Missing Word',
    { options: sw.options },
    { correct: sw.correct },
    { total: 1 }, 1, sw.audio, 60);

  // 2 highlight incorrect words
  for (let k = 0; k < Math.min(2, hiw.length); k++) {
    const hw = hiw[(i * 2 + k) % hiw.length];
    addQ(testId, 'listening', 'listening_highlight_incorrect', order++, hw.title,
      { transcript: hw.transcript },
      { incorrect_words: hw.incorrect_words },
      { per_correct: 1, per_wrong: -1 }, hw.incorrect_words.length, hw.audio, 120);
  }

  // 3 write from dictation
  for (let k = 0; k < 3; k++) {
    const sent = wfd[(i * 3 + k) % wfd.length];
    addQ(testId, 'listening', 'listening_write_dictation', order++, 'Write from Dictation',
      {}, { text: sent },
      { per_word: 1 }, sent.split(/\s+/).length, sent, 180);
  }
}

// Build 10 full mocks
for (let i = 0; i < 10; i++) {
  buildFullMock(T(`Full Mock Test ${i + 1}`), i);
}

// ── SECTION PRACTICE TESTS ───────────────────────────────────────────────────
function buildSpeakingPractice(testId) {
  let order = 1;
  readAloudPassages.slice(0, 8).forEach(p => {
    addQ(testId, 'speaking', 'speaking_read_aloud', order++, p.title, { text: p.text }, { text: p.text }, { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, null, 35);
  });
  repeatSentences.slice(0, 10).forEach(s => {
    addQ(testId, 'speaking', 'speaking_repeat_sentence', order++, 'Repeat Sentence', { audio_text: s }, { text: s }, { content: 3, oral_fluency: 3, pronunciation: 3 }, 9, s, 15);
  });
  describeImages.slice(0, 5).forEach(d => {
    addQ(testId, 'speaking', 'speaking_describe_image', order++, d.title, { image_type: d.image_type, description: d.description, data: d.data }, { key_points: d.key_points }, { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, null, 40);
  });
  retellLectures.slice(0, 2).forEach(r => {
    addQ(testId, 'speaking', 'speaking_retell_lecture', order++, r.title, { lecture_text: r.lecture, topic: r.topic }, { key_points: r.key_points }, { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, r.lecture, 40);
  });
  answerShortQs.slice(0, 10).forEach(q => {
    addQ(testId, 'speaking', 'speaking_answer_short', order++, 'Answer Short Question', { question: q.q }, { text: q.a, alternatives: q.alts }, { pronunciation: 3 }, 3, q.q, 10);
  });
}

function buildWritingPractice(testId) {
  let order = 1;
  swtPassages.forEach(s => {
    addQ(testId, 'writing', 'writing_summarize_text', order++, s.title, { text: s.text }, { sample: s.sample, key_points: s.key_points }, { content: 2, form: 1, grammar: 2, vocabulary: 2, spelling: 2 }, 9, null, 600);
  });
  essayPrompts.forEach(e => {
    addQ(testId, 'writing', 'writing_essay', order++, 'Write Essay', { prompt: e.prompt, type: e.type }, { sample_outline: '', key_arguments: e.key_arguments }, { content: 3, form: 2, grammar: 2, vocabulary: 2, spelling: 2, cohesion: 2 }, 13, null, 1200);
  });
}

function buildReadingPractice(testId) {
  let order = 1;
  rwFIBs.forEach(r => {
    addQ(testId, 'reading', 'reading_rw_fill_blanks', order++, r.title, { text: r.text, blanks: r.blanks }, { answers: r.answers }, { per_blank: 1 }, r.answers.length, null, 120);
  });
  readingMCMAs.forEach(r => {
    addQ(testId, 'reading', 'reading_mcma', order++, r.title, { text: r.text, question: r.question, options: r.options }, { correct: r.correct }, { partial: true, per_correct: 1, per_wrong: -1 }, r.correct.length, null, 120);
  });
  reorderSets.forEach(r => {
    addQ(testId, 'reading', 'reading_reorder', order++, r.title, { paragraphs: [...r.paragraphs].sort(() => Math.random() - 0.5) }, { order: r.answer_order }, { partial: true }, r.answer_order.length - 1, null, 120);
  });
  readingFIBs.forEach(r => {
    addQ(testId, 'reading', 'reading_fill_blanks', order++, r.title, { text: r.text, word_bank: r.word_bank }, { answers: r.answers }, { per_blank: 1 }, r.answers.length, null, 120);
  });
  readingMCSAs.forEach(r => {
    addQ(testId, 'reading', 'reading_mcsa', order++, r.title, { text: r.text, question: r.question, options: r.options }, { correct: r.correct }, { total: 1 }, 1, null, 120);
  });
}

function buildListeningPractice(testId) {
  let order = 1;
  listeningSSTs.forEach(s => {
    addQ(testId, 'listening', 'listening_summarize', order++, s.title, { topic: s.title, duration: 60 }, { sample: s.sample, key_points: s.key_points }, { content: 2, form: 1, grammar: 2, vocabulary: 2, spelling: 2 }, 9, s.audio, 600);
  });
  listeningMCMAs.forEach(l => {
    addQ(testId, 'listening', 'listening_mcma', order++, l.title, { question: l.question, options: l.options }, { correct: l.correct }, { partial: true, per_correct: 1, per_wrong: -1 }, l.correct.length, l.audio, 120);
  });
  listeningFIBs.forEach(l => {
    addQ(testId, 'listening', 'listening_fill_blanks', order++, l.title, { text: l.transcript }, { answers: l.answers }, { per_blank: 1 }, l.answers.length, l.audio, 120);
  });
  listeningHCSs.forEach(h => {
    addQ(testId, 'listening', 'listening_highlight_summary', order++, h.title, { options: h.options }, { correct: h.correct }, { total: 1 }, 1, h.audio, 60);
  });
  listeningMCSAs.forEach(l => {
    addQ(testId, 'listening', 'listening_mcsa', order++, l.title, { question: l.question, options: l.options }, { correct: l.correct }, { total: 1 }, 1, l.audio, 60);
  });
  listeningSMWs.forEach(s => {
    addQ(testId, 'listening', 'listening_missing_word', order++, 'Select Missing Word', { options: s.options }, { correct: s.correct }, { total: 1 }, 1, s.audio, 60);
  });
  listeningHIWs.forEach(h => {
    addQ(testId, 'listening', 'listening_highlight_incorrect', order++, h.title, { transcript: h.transcript }, { incorrect_words: h.incorrect_words }, { per_correct: 1, per_wrong: -1 }, h.incorrect_words.length, h.audio, 120);
  });
  wfdSentences.slice(0, 10).forEach(s => {
    addQ(testId, 'listening', 'listening_write_dictation', order++, 'Write from Dictation', {}, { text: s }, { per_word: 1 }, s.split(/\s+/).length, s, 180);
  });
}

buildSpeakingPractice(T('Speaking Practice'));
buildWritingPractice(T('Writing Practice'));
buildReadingPractice(T('Reading Practice'));
buildListeningPractice(T('Listening Practice'));

// ── MINI MOCKS ────────────────────────────────────────────────────────────────
function buildMiniMock(testId, offset) {
  let order = 1;
  // 3 RA, 5 RS, 1 DI, 5 ASQ, 1 SWT, 3 RWFIB, 1 ROP, 1 SST, 1 FIB, 2 WFD
  readAloudPassages.slice(offset, offset + 3).forEach(p =>
    addQ(testId, 'speaking', 'speaking_read_aloud', order++, p.title, { text: p.text }, { text: p.text }, { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, null, 35));
  repeatSentences.slice(offset * 2, offset * 2 + 5).forEach(s =>
    addQ(testId, 'speaking', 'speaking_repeat_sentence', order++, 'Repeat Sentence', { audio_text: s }, { text: s }, { content: 3, oral_fluency: 3, pronunciation: 3 }, 9, s, 15));
  const di = describeImages[offset % describeImages.length];
  addQ(testId, 'speaking', 'speaking_describe_image', order++, di.title, { image_type: di.image_type, description: di.description, data: di.data }, { key_points: di.key_points }, { content: 5, oral_fluency: 5, pronunciation: 5 }, 15, null, 40);
  answerShortQs.slice(offset, offset + 5).forEach(q =>
    addQ(testId, 'speaking', 'speaking_answer_short', order++, 'Answer Short Question', { question: q.q }, { text: q.a, alternatives: q.alts }, { pronunciation: 3 }, 3, q.q, 10));
  const swt = swtPassages[offset % swtPassages.length];
  addQ(testId, 'writing', 'writing_summarize_text', order++, swt.title, { text: swt.text }, { sample: swt.sample, key_points: swt.key_points }, { content: 2, form: 1, grammar: 2, vocabulary: 2, spelling: 2 }, 9, null, 600);
  rwFIBs.slice(0, 3).forEach(r =>
    addQ(testId, 'reading', 'reading_rw_fill_blanks', order++, r.title, { text: r.text, blanks: r.blanks }, { answers: r.answers }, { per_blank: 1 }, r.answers.length, null, 120));
  const rop = reorderSets[offset % reorderSets.length];
  addQ(testId, 'reading', 'reading_reorder', order++, rop.title, { paragraphs: [...rop.paragraphs].sort(() => Math.random() - 0.5) }, { order: rop.answer_order }, { partial: true }, rop.answer_order.length - 1, null, 120);
  const sst = listeningSSTs[offset % listeningSSTs.length];
  addQ(testId, 'listening', 'listening_summarize', order++, sst.title, { topic: sst.title, duration: 60 }, { sample: sst.sample, key_points: sst.key_points }, { content: 2, form: 1, grammar: 2, vocabulary: 2, spelling: 2 }, 9, sst.audio, 600);
  const lfib = listeningFIBs[offset % listeningFIBs.length];
  addQ(testId, 'listening', 'listening_fill_blanks', order++, lfib.title, { text: lfib.transcript }, { answers: lfib.answers }, { per_blank: 1 }, lfib.answers.length, lfib.audio, 120);
  wfdSentences.slice(offset * 2, offset * 2 + 2).forEach(s =>
    addQ(testId, 'listening', 'listening_write_dictation', order++, 'Write from Dictation', {}, { text: s }, { per_word: 1 }, s.split(/\s+/).length, s, 180));
}

buildMiniMock(T('Mini Mock 1 — Easy'), 0);
buildMiniMock(T('Mini Mock 2 — Medium'), 3);
buildMiniMock(T('Mini Mock 3 — Hard'), 6);

// ── REPEAT SENTENCE DRILL ────────────────────────────────────────────────────
let drillOrder = 1;
repeatSentences.forEach(s => {
  addQ(T('Repeat Sentence Drill'), 'speaking', 'speaking_repeat_sentence', drillOrder++, 'Repeat Sentence', { audio_text: s }, { text: s }, { content: 3, oral_fluency: 3, pronunciation: 3 }, 9, s, 15);
});

// ── WRITE FROM DICTATION DRILL ───────────────────────────────────────────────
let wfdOrder = 1;
wfdSentences.forEach(s => {
  addQ(T('Write from Dictation Drill'), 'listening', 'listening_write_dictation', wfdOrder++, 'Write from Dictation', {}, { text: s }, { per_word: 1 }, s.split(/\s+/).length, s, 180);
});

// ── READING FILL BLANKS DRILL ────────────────────────────────────────────────
let rfibOrder = 1;
// Mix of rw_fill_blanks and reading_fill_blanks
rwFIBs.forEach(r => {
  addQ(T('Reading Fill Blanks Drill'), 'reading', 'reading_rw_fill_blanks', rfibOrder++, r.title, { text: r.text, blanks: r.blanks }, { answers: r.answers }, { per_blank: 1 }, r.answers.length, null, 120);
});
readingFIBs.forEach(r => {
  addQ(T('Reading Fill Blanks Drill'), 'reading', 'reading_fill_blanks', rfibOrder++, r.title, { text: r.text, word_bank: r.word_bank }, { answers: r.answers }, { per_blank: 1 }, r.answers.length, null, 120);
});

// ── Update total_questions counts ────────────────────────────────────────────
const updateCount = db.prepare('UPDATE tests SET total_questions = (SELECT COUNT(*) FROM questions WHERE test_id = tests.id) WHERE id = ?');
insertedTests.forEach(t => updateCount.run(t.id));

const totalQ = db.prepare('SELECT COUNT(*) as c FROM questions').get().c;
const totalT = db.prepare('SELECT COUNT(*) as c FROM tests').get().c;
console.log(`✓ Seeded ${totalT} tests and ${totalQ} questions.`);
