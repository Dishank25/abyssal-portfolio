// The guide answers from the same published content that renders the portfolio.
// It runs locally on GitHub Pages as well as on the Django site.
(() => {
  "use strict";

  const stop = new Set(("a an and are as at be been about can could did do does for from give he her him his how i in into is it its me more of on or please s show some tell than that the their them these they this those to us was what which who why will with would you your dishank jain project projects system systems work works build built use uses using used").split(" "));
  const equivalents = [
    ["recommender", "recommenders", "recommendation", "recommendations", "personalization", "suggestions"],
    ["embeddings", "embedding", "vector", "vectors"],
    ["faq", "faqs", "policy", "policies"],
    ["images", "image", "photo", "photograph", "photos", "pictures", "picture"],
    ["extraction", "extract", "extracts", "parsing", "parse"],
    ["evaluation", "evaluate", "evaluated", "evaluates", "evaluating", "testing", "tested", "tests", "test", "benchmark", "reliable", "reliability"],
    ["threshold", "thresholds", "cutoff"],
    ["fallback", "abstain", "abstains", "declines", "decline", "refuse", "refuses", "weak"],
    ["validation", "validating", "validate", "validated", "validates"],
    ["recruiter", "recruiters", "recruitment", "hiring"],
    ["application", "applications", "apply", "applicant", "applicants"],
    ["veterinary", "veterinarian", "vet"],
    ["recommendations", "suggest", "recommend"],
    ["education", "studied", "degree", "college", "university"],
    ["intern", "internship", "interned"],
    ["terminal", "cli", "commandline"],
    ["ranking", "rank", "ranked", "ranks"],
    ["document", "documents", "pdf", "pdfs"],
    ["experience", "background", "career"],
    ["ml", "machinelearning"],
    ["repository", "repo", "repos", "repositories", "source", "code"],
  ];
  const vocabulary = new Map();
  for (const [canonical, ...others] of equivalents) {
    for (const word of [canonical, ...others]) if (!vocabulary.has(word)) vocabulary.set(word, canonical);
  }
  const normalize = value => String(value).toLowerCase().normalize("NFKD").replace(/[’']/g, "")
    .replace(/[^a-z0-9+#]+/g, " ").trim().replace(/\s+/g, " ");
  const tokens = value => [...new Set(normalize(value).split(" ").filter(t => t && !stop.has(t))
    .map(t => vocabulary.get(t) || t))];
  const inside = (value, phrase) => (" " + value + " ").includes(" " + normalize(phrase) + " ");
  const aliases = {
    "pawsupport": ["paw support", "paw assistant", "faq router", "pet care assistant", "ziglypawsupport"],
    "supportpilot": ["support pilot", "confidence gate", "threshold demo"],
    "abyssal-portfolio": ["abyssal portfolio", "this website", "this site", "this portfolio", "django portfolio", "observatory portfolio"],
    "veterinary-records": ["veterinary records", "veterinary pdf", "vet records", "vet pdf", "veterinary extraction", "pdf extractor"],
    "recommendations": ["recommender", "recommendation engine", "recommendation system", "product recommender", "product recommendations", "collaborative filtering"],
    "breed-identification": ["pet breed", "breed identification", "breed detection", "breed classifier", "pet classifier", "gpt 4o vision"],
    "job-portal": ["job portal", "recruiter portal", "student portal", "recruiter app"],
    "job-discovery": ["job discovery", "candidate app", "candidate experience", "job search app"],
    "terminal-tic-tac-toe": ["tic tac toe", "tictactoe", "terminal game", "python game", "noughts and crosses"],
  };
  const unknownTopics = /\b(salary|salaries|compensation|ctc|age|birthday|birthdate|born|married|spouse|parents|girlfriend|boyfriend|religion|caste|hobbies|hobby|favorite|favourite|nationality|citizenship|visa|medical|politics|residential|residence|street|address|phone|mobile number|whatsapp|password|secret|private|confidential|email|e mail|rate per hour|hourly rate|pricing|budget|availability|available to|available for|open to|currently hiring|work remotely|remote work|relocate|start date|notice period|book a|schedule a|arrange a|willing to|willingness|date of birth|how old|marital|how much would|how much will|remote or onsite)\b/;
  const metricQuestion = /\b(accuracy|precision|recall|f1|latency|revenue|roi|number of users|how many users|benchmark score|success rate|conversion rate|percentage|percent|metric|metrics|kpi|performance numbers|how fast|how many customers|how many clients|how much time|time saved)\b/;
  const compare = /\b(compare|versus|vs|difference|different|differ|contrast|better|both)\b/;
  const toolsIntent = /\b(tech|technologies|technology|stack|frameworks?|libraries|languages?|tools|built with|implement(?:ed)? (?:with|in))\b/;
  const source = /\b(repo|repository|repositories|source|code|github|implementation|test cases|demo link)\b/;
  const focusWords = /\b(it|that|this|there|them|these|those|both|one|ones|its|another|follow up|and the|the (?:stack|tech|repo|code|model|data|backend|approach|demo|evaluation))\b/;
  const projectWords = /\b(projects?|prototypes?|apps?|examples?|systems?|studies|portfolio|portfolio work|products?|built|builds|developed|implemented|worked on|worked with|which (?:one|work)|experience with)\b/;
  const roleWords = /\b(experience|career|employment|internships?|intern|jobs?|roles?|employers?|companies|worked|positions?|work history|professional background|professional journey)\b/;
  const educationWords = /\b(education|educational|academic|degree|degrees|graduation|graduate|graduated|graduating|university|college|school|qualification|qualifications|studied|study|training|course|courses|certification|certifications|certificates|certified|euron|btech|b tech|fine tuning)\b/;
  const skillWords = /\b(skills?|strengths?|expertise|speciali[sz](?:e|es|ed|ation)|toolkit|proficient|good at|know how to|tech stack|technical background)\b/;
  const sectionTitles = {work: "Selected work", about: "About Dishank", experience: "Work history & education", skills: "Technical skills", contact: "Contact Dishank"};
  const roleQuote = body => "In Dishank’s words: “" + body + "”";
  const locationIntent = /\b(where.*(?:based|live|located|from)|location|where.*city|what city|which city)\b/;
  const contactIntent = /\b(contact|connect|linkedin|reach (?:out|him|you|dishank)|get in touch|hire|recruit|collaborat(?:e|ion)|message him|talk to him)\b/;
  const bioIntent = /\b(who (?:is|s|are)|whos|about (?:yourself|himself|him|you|dishank)|introduc\w*|summari[sz]e|biography|overview|what (?:does|do) (?:he|you|dishank) do|everything about|what makes|engineering approach|work philosophy|how (?:you|he) (?:think|approach)|tell me about dishank|elevator pitch)\b/;

  function create(site, homePath, currentProject) {
    const projects = site.projects;
    const base = new URL(homePath || "./", document.baseURI);
    const section = id => ({label: sectionTitles[id], url: new URL("#" + id, base).href});
    const caseLink = project => ({label: project.title, url: new URL("projects/" + project.id + "/", base).href});
    const contact = () => site.contact.links.map(({label, url}) => ({label, url}));
    const byId = new Map(projects.map(project => [project.id, project]));
    const records = projects.map(project => {
      const names = [project.title, ...(aliases[project.id] || [])].map(normalize);
      return {project, names, title: tokens(project.title), tags: tokens(project.tags.join(" ")),
        lead: tokens(project.category + " " + project.intro), body: tokens(project.paragraphs.join(" "))};
    });
    const frequency = new Map();
    for (const record of records) {
      for (const term of new Set([...record.title, ...record.tags, ...record.lead, ...record.body])) {
        frequency.set(term, (frequency.get(term) || 0) + 1);
      }
    }
    let focus = currentProject && byId.has(currentProject) ? [currentProject] : [];
    let lastTopic = focus.length ? "project" : "";
    let lastRole = null;
    let skillTerms = [];
    const answer = (text, links = [], prompts = []) => ({text, links, prompts});
    const unavailable = () => answer("That detail isn’t published in Dishank’s portfolio. For a personal question, an opportunity, or a commitment, please ask him directly.", contact(), ["What is his current role?", "What has he built?"]);

    function rankedProjects(question) {
      const terms = tokens(question);
      return records.map(record => {
        const matchedName = record.names.some(name => inside(question, name));
        let score = 0;
        let matched = 0;
        for (const term of terms) {
          const idf = Math.log((records.length + 1) / ((frequency.get(term) || 0) + .5));
          const field = record.title.includes(term) ? 4 : record.tags.includes(term) ? 3 : record.lead.includes(term) ? 2 : record.body.includes(term) ? 1 : 0;
          if (field) { score += idf * field; matched++; }
        }
        return {p: record.project, named: matchedName, score, matched};
      }).sort((a,b) => Number(b.named) - Number(a.named) || b.score - a.score);
    }
    function projectList(list, caption) {
      lastTopic = "list"; focus = list.map(p => p.id);
      return answer(caption + "\n\n" + list.map(p => p.title + " — " + p.intro).join("\n\n"), list.map(caseLink),
        list.slice(0, 2).map(p => "How does " + p.title + " work?"));
    }
    function projectAnswer(p, q) {
      focus = [p.id]; lastTopic = "project";
      const refs = [caseLink(p)];
      if (metricQuestion.test(q)) {
        return answer("The " + p.title + " case study doesn’t publish a measured result for that metric. " +
          (p.id === "pawsupport" ? "It does describe how the router is tested against expected FAQ identifiers." : p.intro),
          refs, ["How does it work?", "What tools does it use?"]);
      }
      if (source.test(q)) {
        const links = [...refs, ...p.links];
        return answer(p.links.length ? "Here are the published implementation links for " + p.title + "." :
          "Dishank shares a case study for " + p.title + ". A public code repository isn’t listed for it.", links, ["What tools does it use?"]);
      }
      if (toolsIntent.test(q) && !/\b(which|what) (data|signal|threshold|model response)\b/.test(q)) {
        return answer(p.title + " lists " + p.tags.join(", ") + ". " + p.intro, refs, ["How does it work?", "Show me the source code"]);
      }
      const queryTerms = tokens(q);
      let paragraphs = p.paragraphs.map((s, i) => ({s, i, score: tokens(s).filter(t => queryTerms.includes(t)).length}))
        .sort((a,b) => b.score-a.score || a.i-b.i);
      if (/\b(tell me more|more detail|go deeper|what else|explain further)\b/.test(q) && paragraphs.length > 1) paragraphs = paragraphs.slice(1).concat(paragraphs[0]);
      const evidenceLink = p.links.find(l => /evaluation|threshold|test cases/.test(l.label.toLowerCase()) && /evaluat|threshold|test|fallback/.test(q));
      if (evidenceLink) refs.push(evidenceLink);
      return answer(p.title + " — " + p.intro + "\n\n" + roleQuote(paragraphs[0].s), refs,
        ["What tools does it use?", "Show me the source code"]);
    }
    function compareProjects(list, q) {
      focus = list.map(p => p.id); lastTopic = "compare";
      const details = list.map(p => p.title + " — " + p.intro +
        (toolsIntent.test(q) ? " Tools: " + p.tags.join(", ") + "." : ""));
      if (focus.includes("pawsupport") && focus.includes("supportpilot")) {
        details.push("PawSupport checks the ID of the chosen FAQ against labeled examples. SupportPilot retrieves three FAQ candidates and falls back when even the closest match falls short of its threshold.");
      } else if (focus.includes("job-portal") && focus.includes("job-discovery")) {
        details.push("The two Flutter snapshots share code. The portal case study covers both students and recruiters; Job Discovery follows a candidate through onboarding, filtering and the application BLoC.");
      }
      return answer(details.join("\n\n"), list.map(caseLink), list.slice(0,2).map(p => "How does " + p.title + " work?"));
    }
    function roleAnswer(q, namedRole) {
      lastTopic = "experience"; focus = [];
      const previousIndex = lastRole ? site.experience.indexOf(lastRole) + 1 : 1;
      const role = namedRole || (/\b(current|now|today|present|latest|currently|where (?:do you|does .*?) work)\b/.test(q) ? site.experience[0] :
        /\b(previous|prior|last role|last job|before (?:this|that|current))\b/.test(q) ? site.experience[previousIndex] :
        /\b(first|earliest|intern|internship)\b/.test(q) ? site.experience[site.experience.length-1] : null);
      const line = r => r.title + " · " + r.company + " (" + r.dates + ")";
      lastRole = role || null;
      if (role) return answer(line(role) + "\n\n" + roleQuote(role.body), [section("experience")], ["Show his career timeline", "What are his skills?"]);
      return answer("Dishank’s published work history, most recent first:\n\n"+site.experience.map(line).join("\n\n"),
        [section("experience")], ["What is his current role?", "Where did he study?"]);
    }
    function skillsAnswer(q) {
      lastTopic = "skills"; focus = [];
      const terms = tokens(q);
      if (/\b(programming languages?|languages? (?:does|do|can)|languages? (?:he|you) code)\b/.test(q)) {
        skillTerms = ["python", "flutter"];
        return answer("Dishank uses Python for APIs, retrieval, data processing, and this Django site. He uses Dart for Flutter apps and state management.", [section("skills"), caseLink(byId.get("abyssal-portfolio")), caseLink(byId.get("job-portal"))], ["Show his Python projects", "Show his Flutter projects"]);
      }
      const skills = site.skills.map(s => ({s, overlap: tokens(s.title + " " + s.body).filter(t => terms.includes(t)).length})).sort((a,b)=>b.overlap-a.overlap);
      if (skills[0].overlap >= 1 && !/\b(all|across|overall)\b/.test(q)) {
        const s = skills[0].s;
        skillTerms = tokens(s.body);
        return answer(s.title + "\n\n" + roleQuote(s.body), [section("skills")], ["Which projects use those tools?", "Show all skills"]);
      }
      skillTerms = [];
      return answer(site.skills.map(s => s.title + "\n“" + s.body + "”").join("\n\n"),
        [section("skills")], ["Which projects use Python?", "Show his Flutter projects"]);
    }

    function respond(question) {
      const q = normalize(question);
      if (!q) return answer("Ask me about Dishank’s projects, tools, education or experience.");
      const guideQuestion = /\b(who built you|how do you (?:answer|work)|are you an ai|are you real|are you dishank|what can you do|who are you|what(?:s| is) your name|your name|what are you called|who (?:is|s) abby|whos abby|what does abby do|what is abby|this robot|this chatbot|this guide|observatory guide|send my question|store my questions|save my messages|questions leave|powered by (?:openai|a language model))\b/;
      if (guideQuestion.test(q)) {
        return answer("I’m Abby, Dishank’s robo assistant. I’m here to help you explore his portfolio. I match your question to published projects, skills and career notes in this browser, and include source links. Your messages stay in the page. For a personal reply, reach Dishank on LinkedIn.", [section("about"), ...contact().slice(0,1)]);
      }
      const commitment = /\b(job offer|offer letter|my terms|our terms|accept (?:an?|our|my|the) (?:offer|contract|position)|agree to|sign (?:an?|our|my|the) contract|can (?:he|dishank) start)\b/.test(q);
      if (unknownTopics.test(q) || commitment) return unavailable();
      if (/\b(resume|cv|résumé)\b/.test(q)) {
        return answer("His professional timeline and education are published in the portfolio. For a résumé file, contact Dishank directly.", [section("experience"), ...contact().slice(0,1)]);
      }
      if (lastTopic === "experience" && /\b(before (?:that|this|then)|prior to that|after (?:that|this) role)\b/.test(q)) {
        if (q.includes("after") && lastRole) {
          const newer = site.experience[site.experience.indexOf(lastRole)-1];
          return newer ? roleAnswer(q, newer) : answer("That is the most recent role listed in Dishank’s portfolio.", [section("experience")]);
        }
        return roleAnswer("before that", null);
      }
      const ranked = rankedProjects(q);
      const named = ranked.filter(r=>r.named).map(r=>r.p);
      const tech = ["flutter","dart","python","fastapi","django","chromadb","embeddings","computer vision","structured outputs","machine learning","semantic search","bloc","dio","gpt 4o vision","collaborative filtering","cosine similarity","ranking"].filter(t=>inside(q,t));
      const technicalProjects = projects.filter(p => tech.some(t=>p.tags.some(tag=>inside(normalize(tag),t)) || inside(normalize(p.category),t)));
      const listIntent = /\b(which|what|show|list|any|examples|where|find|other|all|both|two|has he)\b/.test(q) && projectWords.test(q);
      if (lastTopic === "skills" && /\b(those|these|them)\b/.test(q) && projectWords.test(q)) {
        const relevant = projects.filter(p => p.tags.some(tag => tokens(tag).some(t => skillTerms.includes(t))));
        return projectList(relevant.length ? relevant : projects, "These case studies show the techniques in practice.");
      }
      if (compare.test(q) && named.length === 1 && focus.length === 1 && focus[0] !== named[0].id && focusWords.test(q)) {
        return compareProjects([byId.get(focus[0]), named[0]], q);
      }
      if (named.length > 1) return compareProjects(named, q);
      if (named.length === 1 && !/\b(education|educational|degree|studied|role at|worked at)\b/.test(q)) return projectAnswer(named[0], q);
      if (compare.test(q) && focus.length===2) return compareProjects(focus.map(id=>byId.get(id)),q);
      if (compare.test(q) && /\b(faq|support|retrieval|chatbots?)\b/.test(q)) return compareProjects([byId.get("pawsupport"),byId.get("supportpilot")],q);
      if (listIntent && tech.length && technicalProjects.length) return projectList(technicalProjects, "Here is Dishank’s work using " + tech.join(" and ") + ".");
      if (listIntent && /\b(rag|retrieval|faq|chatbots?|retrieval augmented generation)\b/.test(q)) {
        return projectList([byId.get("pawsupport"), byId.get("supportpilot")], "These two projects retrieve approved FAQ material before producing a response.");
      }
      if (listIntent && /\b(ai|artificial intelligence)\b/.test(q)) {
        return projectList(projects.filter(p=>["pawsupport","supportpilot","veterinary-records","recommendations","breed-identification"].includes(p.id)), "These five projects cover Dishank’s applied AI work.");
      }
      const generalProjectQuestion = /\b(?:which|what) (?:other )?(?:projects|apps|case studies) (?:has|have|did|does|do) (?:he|dishank|you) (?:built|build|made|make|created|create|developed|develop|worked on|work on|have)(?: in (?:his|your|the) portfolio)?$/.test(q);
      if ((generalProjectQuestion || /\b(how many|number of|all|list|show|browse|walk me through)\b/.test(q) && /\b(projects|case studies|portfolio work)\b/.test(q)) && !tech.length && !/\b(this|that|the one)\b/.test(q))
        return projectList(projects, "The portfolio documents " + projects.length + " projects.");
      if (educationWords.test(q) && !/\b(case study|case studies|job portal|flutter app)\b/.test(q)) {
        focus=[];lastTopic="education";
        const ed = site.education.filter(e=>/\b(courses?|certifications?|certified|certificates?|training|euron|fine tuning)\b/.test(q) ? !/b\.tech/i.test(e.title) : true);
        return answer(ed.map(e=>e.title+" · "+e.institution+" ("+e.date+")").join("\n\n"),[section("experience")],["What did he work on first?", "What are his skills?"]);
      }
      if (contactIntent.test(q)) {lastTopic="contact";focus=[];return answer("The public way to reach Dishank is LinkedIn. You can also browse his repositories on GitHub.", contact());}
      if (locationIntent.test(q)) {lastTopic="about";focus=[];return answer("Dishank is based in "+site.location+". He works in AI engineering and consulting.",[section("about")]);}
      const companyWords = company => normalize(company).split(" ").filter(word =>
        word.length > 2 && !["and", "group", "first", "institutions", "pvt", "ltd", "pet", "care"].includes(word));
      const matchingEmployers = site.experience.map(role => ({role,
        score: companyWords(role.company.split(" · ")[0]).filter(word=>inside(q,word)).length}))
        .filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
      const namedRole = matchingEmployers.length && matchingEmployers[0].score > (matchingEmployers[1]?.score || 0)
        ? matchingEmployers[0].role : null;
      if (/\b(experience with|proficient in|expertise in|work(?:ed)? with)\b/.test(q) && !namedRole && !tech.length) {
        const terms = tokens(q).filter(t => !["experience", "proficient", "expertise", "worked"].includes(t));
        const evidence = tokens(site.skills.map(s=>s.body).concat(projects.map(p=>p.tags.join(" "))).join(" "));
        if (terms.length && !terms.some(t=>evidence.includes(t))) return unavailable();
      }
      if (namedRole || (roleWords.test(q) && !listIntent && (!tech.length || /\b(job|role|career|employment|timeline|employer|worked at)\b/.test(q))) || /\b(where (?:does (?:he|dishank)|do you) work|what (?:did he|did you) work on first|where.*intern)\b/.test(q)) return roleAnswer(q,namedRole);
      const followedProject = focus.length===1 && byId.get(focus[0]);
      const technicalFollowUp = toolsIntent.test(q) || source.test(q) || metricQuestion.test(q) || /\b(work|works|test|evaluate|evaluated|compare|implemented|implementation|input|output|do|does|use|uses|architecture|handle|model|data|technical|flow|demo|learn|training|design|built|train|validate|deploy|algorithm|fail|confidence|threshold)\b/.test(q);
      if (followedProject && ((technicalFollowUp && focusWords.test(q)) || /^(how does it|what tools|which tools|tell me more|go deeper|source code|show me the source|how did (?:you|he) (?:test|build|evaluate))/.test(q)) && !/\b(all projects|his skills|your skills|this person|you as a person)\b/.test(q)) return projectAnswer(followedProject,q);
      if (skillWords.test(q) || toolsIntent.test(q) || /\b(knows?|familiar with|work(?:ed)? with|experience with)\b/.test(q) && tech.length) return skillsAnswer(q);
      if (bioIntent.test(q)) {
        lastTopic="about";focus=[];
        return answer(site.name+" is an AI engineer based in "+site.location+". "+roleQuote(site.hero.lead)+" His work covers semantic search, document extraction, recommendations, and computer vision.",[section("about"),section("work")],["What has he built?", "What is his current role?"]);
      }
      if (/\b(hi|hello|hey|help|start)\b/.test(q) && q.split(" ").length<6) return answer("Hi, I’m Abby, Dishank’s robo assistant. Ask about his engineering work, career, skills or a particular project.",[section("about")],["What has he built?", "Which tools does he use?"]);
      if (/\b(github|repos|repositories|source code)\b/.test(q) && ranked[0].matched<=1) return answer("Dishank publishes his code on GitHub. Individual case studies link to the repositories where source is available.",[contact().find(l=>l.label==="GitHub"),section("work")]);
      if (/\b(what (?:has|have) (?:he|you|dishank) (?:built|made)|his projects|your projects|featured work|portfolio projects|selected work)\b/.test(q)) return projectList(projects, "These are the projects in Dishank’s portfolio.");
      if (tech.length && technicalProjects.length) return projectList(technicalProjects,"These case studies use "+tech.join(" and ")+".");
      if (ranked[0].score>=3 && (ranked[0].matched>=2 || ranked[0].score>=5) && (projectWords.test(q) || /\b(how|why|which|what|where|tell)\b/.test(q))) {
        if (ranked[1].score>=ranked[0].score*.82 && ranked[1].score>2 && !compare.test(q)) {
          const candidates=ranked.slice(0,2).map(r=>r.p);
          return answer("Two projects fit that description. Which one would you like to explore?",candidates.map(caseLink),candidates.map(p=>p.title));
        }
        return projectAnswer(ranked[0].p,q);
      }
      return answer("I couldn’t find that in Dishank’s published portfolio. I can help with a specific project, his background, his skills, or how to reach him.",[section("work"),section("contact")],["Show all projects", "What is his current role?", "How can I contact him?"]);
    }
    return {reply(value) {
      const input = String(value).trim().slice(0,700);
      const parts=input.split(/(?:[?;]\s*|\s+and\s+(?=(?:where|what|when|which|who|how|can|does|do|tell me|show me)\b))/i).map(s=>s.trim()).filter(Boolean).slice(0,3);
      if (parts.length<=1) return respond(input);
      const responses=parts.map(respond);
      const links=new Map();
      for(const response of responses) for(const link of response.links) if (link) links.set(link.url,link);
      return answer(responses.map(r=>r.text).join("\n\n"), [...links.values()], responses[responses.length - 1].prompts);
    }};
  }
  window.ObservatoryGuide = {name: 'Abby', create};
})();
