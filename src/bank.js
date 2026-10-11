// ===== Pass The PMP: original exam-style question bank (aligned to the July 2026 PMP ECO) =====
// d: domain, t: ECO task, ap: P predictive · A agile · H hybrid, type: mc | mr | match | drop | hot | graph
// All items are original and written for Pass The PMP.
const BANK = [];
const Q = o => BANK.push(o);
const PE = "People", PR = "Process", BE = "Business Environment";

// ---------------- PEOPLE ----------------
Q({ id: "q001", d: PE, t: 1, ap: "A", type: "mc",
  stem: "A newly formed agile team is building a digital account-opening product for a bank. In the first week, developers, designers and the product owner describe success in very different ways. What should the project manager do first?",
  opts: ["Write a product vision statement and email it to the team for reference", "Facilitate a workshop with the team and product owner to co-create a shared product vision and success measures", "Ask the sponsor to decide what success means and announce it", "Start the first sprint so the vision can emerge from the work"],
  ans: 1, why: "A common vision is built with the people who will deliver it. Facilitating the team and product owner to create it together builds shared understanding and commitment.",
  notes: ["A vision written alone and emailed rarely creates shared ownership.", "", "The sponsor's input matters, but announcing a vision skips the team's understanding.", "Starting without a shared goal risks wasted effort and conflicting priorities."] });
Q({ id: "q002", d: PE, t: 1, ap: "P", type: "mr", pick: 2,
  stem: "A project manager is preparing the kick-off meeting for a predictive construction project. Team members have asked how their work connects to the organisation's goals. Which TWO actions will best help create a common vision?",
  opts: ["Review the project charter's objectives and success criteria with the team", "Assign every team member their work packages from the WBS during the meeting", "Develop a project vision statement with the team and key stakeholders", "Publish a RACI chart before the meeting", "Announce individual performance bonuses linked to milestones"],
  ans: [0, 2], why: "Reviewing the charter's objectives and creating a vision statement together connect the team's work to business goals and build shared purpose.",
  notes: ["", "Assigning tasks is planning detail, not shared vision.", "", "A RACI clarifies roles, not purpose.", "Bonuses may motivate but do not create a shared understanding of the goal."] });
Q({ id: "q003", d: PE, t: 1, ap: "H", type: "mc",
  stem: "Halfway through a hybrid programme, the sponsor announces that the organisation's priority has shifted from rapid growth to cost reduction. Team members are unsure whether their current work still matters. What should the project manager do next?",
  opts: ["Continue with the current plan until a formal change request arrives", "Work with the sponsor to update the vision and success criteria, then communicate them to the team and realign the plan and backlog", "Ask each team lead to decide how the change affects their area", "Pause all work until the next quarterly planning cycle"],
  ans: 1, why: "When strategy changes, the project's vision and success criteria must be updated with the sponsor and shared, so the team can realign its work.",
  notes: ["Waiting leaves the team working on things that may no longer matter.", "", "Letting each lead decide creates inconsistent interpretations.", "Pausing everything wastes time; the vision can be updated quickly."] });
Q({ id: "q004", d: PE, t: 2, ap: "H", type: "match",
  stem: "Match each conflict resolution technique to its description.",
  left: ["Collaborate / problem solve", "Compromise / reconcile", "Smooth / accommodate", "Force / direct", "Withdraw / avoid"],
  right: ["Bring in several viewpoints to reach consensus and commitment", "Find a solution that brings some satisfaction to everyone", "Emphasise areas of agreement rather than differences", "Push one viewpoint at the expense of others", "Retreat from the situation or postpone the issue"],
  ans: [0, 1, 2, 3, 4], why: "These five techniques come from conflict management practice. Collaborating usually gives the most lasting result; forcing and withdrawing are short-term at best." });
Q({ id: "q005", d: PE, t: 2, ap: "P", type: "mc",
  stem: "During a client progress meeting, two senior engineers on the project begin arguing openly about a design decision, and the client looks uncomfortable. What should the project manager do?",
  opts: ["Let the argument continue so the client sees the team's thoroughness", "Decide the design issue on the spot to end the argument", "Politely pause the discussion, move the meeting on, and address the disagreement with both engineers privately afterwards", "Ask the client which engineer is right"],
  ans: 2, why: "Conflict should be addressed promptly, privately and directly. Pausing protects the client relationship; resolving it afterwards with both engineers allows a collaborative solution.",
  notes: ["An open argument damages client confidence.", "Deciding without analysis or discussion is forcing.", "", "Asking the client to referee internal disputes is unprofessional."] });
Q({ id: "q006", d: PE, t: 2, ap: "A", type: "mc",
  stem: "During planning poker, most developers estimate a story at 3 points, but one estimates 13 and another estimates 1. What should happen next?",
  opts: ["Take the average estimate", "Accept 3 points because it is the majority view", "Ask the developers with the highest and lowest estimates to explain their reasoning, then estimate again", "Ask the product owner to decide the estimate"],
  ans: 2, why: "Outlying estimates often reveal hidden complexity or a simpler approach. Discussing them and re-voting builds a shared understanding.",
  notes: ["Averaging hides the information behind the disagreement.", "Majority voting ignores what the outliers know.", "", "Estimates belong to the developers, not the product owner."] });
Q({ id: "q007", d: PE, t: 2, ap: "P", type: "mc",
  stem: "In a matrix organisation, a functional manager wants to move a key engineer off your project two months earlier than the resource plan agreed. What should the project manager do first?",
  opts: ["Escalate immediately to the sponsor", "Meet the functional manager to understand the reasons and negotiate a solution that meets both needs", "Refuse, citing the resource management plan", "Accept the change and update the schedule"],
  ans: 1, why: "In a matrix organisation, resources are shared. Understanding the functional manager's need and negotiating collaboratively comes before escalation.",
  notes: ["Escalation comes after attempting to resolve it yourself.", "", "A flat refusal damages the relationship and ignores legitimate needs.", "Accepting without analysis may harm the project."] });
Q({ id: "q008", d: PE, t: 3, ap: "A", type: "mc",
  stem: "A team recently moved from predictive to agile ways of working. At each stand-up, team members wait for the project manager to tell them what to work on next. What should the project manager do?",
  opts: ["Continue assigning tasks until the team is more experienced", "Coach the team to pull work from the sprint backlog and decide among themselves who does what", "Ask the product owner to assign tasks", "Create a detailed task schedule for the sprint"],
  ans: 1, why: "Agile teams self-organise. A servant leader coaches the team to pull work and make its own decisions rather than taking those decisions for them.",
  notes: ["Continuing to assign tasks keeps the team dependent.", "", "The product owner manages what to build, not who does what.", "A detailed schedule is command-and-control, not self-organisation."] });
Q({ id: "q009", d: PE, t: 3, ap: "P", type: "mc",
  stem: "A recently hired team member has missed two deadlines and their work needs significant rework. What should the project manager do first?",
  opts: ["Replace the team member", "Report the performance problem to the functional manager", "Meet the team member privately to understand the causes and agree support, such as coaching or training", "Reassign their tasks to stronger team members"],
  ans: 2, why: "Start by understanding the cause privately. Many performance issues come from unclear expectations, skills gaps or personal circumstances that can be addressed.",
  notes: ["Replacing someone before understanding the problem is premature.", "Escalating before talking to the person skips the first step.", "", "Reassigning work avoids, rather than solves, the problem."] });
Q({ id: "q010", d: PE, t: 3, ap: "H", type: "mc",
  stem: "A team is spread across Lagos, Abuja and Nairobi. Misunderstandings about meeting times, response expectations and which tools to use are causing delays. What should the project manager do?",
  opts: ["Require everyone to work Lagos hours", "Facilitate the creation of a team charter with agreed core hours, communication tools and response times", "Hold all meetings by email to avoid time-zone problems", "Ask each location to work independently"],
  ans: 1, why: "A team charter, or working agreement, sets ground rules the team agrees to, which is especially important for virtual teams.",
  notes: ["Imposing one location's hours ignores the others.", "", "Email alone weakens collaboration.", "Working in silos increases integration problems."] });
Q({ id: "q011", d: PE, t: 3, ap: "A", type: "mr", pick: 3,
  stem: "Which THREE behaviours are characteristic of a servant leader on an agile team?",
  opts: ["Removing impediments that slow the team", "Assigning daily tasks to each developer", "Shielding the team from unnecessary interruptions", "Approving every code change before it is merged", "Coaching the team to improve its practices", "Making the key technical decisions for the team"],
  ans: [0, 2, 4], why: "Servant leaders enable the team: they remove obstacles, protect focus and coach. Directing tasks and making technical decisions for the team are command-and-control behaviours.",
  notes: ["", "Task assignment undermines self-organisation.", "", "Approving every change creates a bottleneck.", "", "Technical decisions belong to the team."] });
Q({ id: "q012", d: PE, t: 3, ap: "P", type: "drop",
  stem: "A new team has begun to argue openly about roles, responsibilities and how work should be done. According to the Tuckman model, the team is in the [ ] stage.",
  opts: ["forming", "storming", "norming", "performing", "adjourning"], ans: 1,
  why: "Storming follows forming and is marked by conflict as people work out roles and approaches. A project manager helps the team move through it towards norming." });
Q({ id: "q013", d: PE, t: 4, ap: "P", type: "hot", fig: "grid",
  stem: "A senior official at the state ministry has the authority to approve or stop your project but shows little interest in its day-to-day progress. Click the quadrant of the power/interest grid that describes how you should engage this stakeholder.",
  ans: "keep-satisfied", why: "High power and low interest: keep satisfied. Give them enough information to stay comfortable and consult them on matters within their authority, without overloading them." });
Q({ id: "q014", d: PE, t: 4, ap: "H", type: "mc",
  stem: "Three months into a project, the team learns that a regulatory agency must inspect and approve the system before launch. The agency was not in the stakeholder register. What should the project manager do first?",
  opts: ["Add the agency to the stakeholder register, analyse its interests and influence, and plan how to engage it", "Ask the sponsor to deal with the agency", "Delay the project until the agency has been briefed", "Wait until the system is ready and then request an inspection"],
  ans: 0, why: "Stakeholder identification continues throughout the project. Register the new stakeholder, analyse them and plan engagement.",
  notes: ["", "The sponsor may help, but stakeholder analysis is the project manager's job.", "Delaying everything is premature before analysis.", "Engaging the regulator late increases the risk of rejection."] });
Q({ id: "q015", d: PE, t: 4, ap: "P", type: "mc",
  stem: "A project manager wants to record that the head of finance is currently resistant to the project but needs to be supportive by the time the new system launches. Which tool is designed for this?",
  opts: ["Responsibility assignment matrix", "Stakeholder engagement assessment matrix", "Risk register", "Requirements traceability matrix"],
  ans: 1, why: "The stakeholder engagement assessment matrix compares each stakeholder's current and desired engagement levels (unaware, resistant, neutral, supportive, leading).",
  notes: ["A RAM shows who does what.", "", "A risk register records uncertain events.", "A traceability matrix links requirements to deliverables."] });
Q({ id: "q016", d: PE, t: 4, ap: "A", type: "mc",
  stem: "The business owner of a new loan product has not attended any sprint reviews, and the team is unsure whether the increments meet the business's needs. What should the project manager do?",
  opts: ["Record the absence in the issue log and continue", "Meet the business owner to understand the barriers to attending and agree a practical way to involve them, such as a shorter review slot or a demo at their office", "Ask the sponsor to require attendance", "Cancel sprint reviews until the business owner is available"],
  ans: 1, why: "Engagement starts with understanding the stakeholder's situation and finding a workable way to involve them. Feedback from the business is essential in agile delivery.",
  notes: ["Logging it does not solve it.", "", "Mandating attendance without understanding the cause rarely builds engagement.", "Reviews matter to the whole team, not only one stakeholder."] });
Q({ id: "q017", d: PE, t: 5, ap: "A", type: "mc",
  stem: "The sponsor expects the first release to include all the features in the original business case, while the product owner plans a minimum viable product with a third of them. What should the project manager do?",
  opts: ["Support the product owner, since they own the backlog", "Facilitate a conversation between the sponsor and product owner to align on the release objectives, value and constraints", "Plan the release with every feature so the sponsor is satisfied", "Ask the team to vote on the release scope"],
  ans: 1, why: "Misaligned expectations between key stakeholders should be surfaced and resolved early, with both parties agreeing on objectives and priorities.",
  notes: ["Taking sides without alignment leaves the conflict unresolved.", "", "Promising everything ignores capacity and value.", "Scope priorities are a business decision, not a team vote."] });
Q({ id: "q018", d: PE, t: 5, ap: "H", type: "mc",
  stem: "A client contracted your firm for a project that uses predictive delivery for hardware and agile delivery for software. The client assumes every software feature in the proposal is fixed. What is the BEST way to align expectations?",
  opts: ["Explain the approach and agree with the client which elements are fixed (such as date and budget) and which are flexible (such as software scope prioritised by value)", "Switch the software work to predictive delivery", "Deliver the software as planned and explain the approach later", "Let the contract wording settle any disagreement"],
  ans: 0, why: "Hybrid projects need explicit agreement on what is fixed and what is flexible, ideally reflected in the charter and contract.",
  notes: ["", "Changing the approach just to avoid a conversation discards the reasons agile was chosen.", "Explaining later creates surprises and mistrust.", "Relying on the contract replaces communication with conflict."] });
Q({ id: "q019", d: PE, t: 5, ap: "P", type: "mr", pick: 2,
  stem: "Which TWO activities at the start of a project best help align stakeholder expectations?",
  opts: ["Agree measurable success criteria and acceptance criteria with key stakeholders", "Promise early delivery to build goodwill", "Review assumptions and constraints with stakeholders and record them", "Keep the scope deliberately vague to allow flexibility", "Limit stakeholder meetings to the sponsor only"],
  ans: [0, 2], why: "Explicit success and acceptance criteria, and shared assumptions and constraints, prevent later disputes about what was expected.",
  notes: ["", "Over-promising creates future disappointment.", "", "Vague scope causes misaligned expectations.", "Excluding stakeholders hides their expectations until it is too late."] });
Q({ id: "q020", d: PE, t: 5, ap: "H", type: "mc",
  stem: "The sales and compliance departments want conflicting features in a customer onboarding app. Both are important stakeholders. What should the project manager do?",
  opts: ["Build both versions and let customers choose", "Facilitate a prioritisation workshop with both departments, using the project's business objectives as the basis, and involve the sponsor if they cannot agree", "Choose the compliance requirement, since regulation always wins", "Ask the development team to decide"],
  ans: 1, why: "Conflicting requirements are resolved against shared business objectives, with the sponsor as decision-maker when stakeholders cannot agree.",
  notes: ["Building both doubles cost and avoids the decision.", "", "Regulatory requirements are mandatory, but the conflict may not be about compliance; analyse first.", "The team should not arbitrate between business stakeholders."] });
Q({ id: "q021", d: PE, t: 6, ap: "P", type: "mc",
  stem: "A director demands a detailed 20-page weekly report. You learn that they never read beyond the first page. What should the project manager do?",
  opts: ["Keep sending the full report, as requested", "Discuss the director's real information needs and update the communications management plan accordingly", "Stop sending the report", "Send the report monthly instead"],
  ans: 1, why: "Communication should meet stakeholders' actual needs. Understanding what the director needs and updating the plan is both efficient and better for engagement.",
  notes: ["Continuing wastes effort and may hide important information.", "", "Stopping without agreement damages trust.", "Changing frequency without discussion may not meet their needs."] });
Q({ id: "q022", d: PE, t: 6, ap: "A", type: "mc",
  stem: "At a sprint review, a key stakeholder is surprised and upset that a feature she expected has not been delivered. The product owner had deprioritised it two sprints ago. What could have prevented this?",
  opts: ["Including every requested feature in each sprint", "Keeping the backlog and its priorities visible and ensuring the product owner communicates priority changes to affected stakeholders", "Preparing a detailed project schedule", "Holding sprint reviews less often"],
  ans: 1, why: "Transparency, through information radiators, a visible backlog and proactive communication, manages expectations in agile delivery.",
  notes: ["Capacity makes that impossible.", "", "A detailed schedule doesn't fit the adaptive approach and wouldn't show priority changes.", "Less frequent reviews would make surprises worse."] });
Q({ id: "q023", d: PE, t: 6, ap: "A", type: "graph", fig: "burnup",
  stem: "The sponsor asks whether all features in the backlog will be delivered by the release date in sprint 10. Based on the burn-up chart, what should the project manager tell the sponsor?",
  opts: ["Yes; the team is on track to deliver everything", "No; at the current rate the full scope will finish around sprint 13, so the sponsor and product owner should consider which features to release first", "The chart cannot be used for forecasting", "Yes, if the team works overtime for the remaining sprints"],
  ans: 1, why: "A burn-up shows completed work against total scope. Extending the trend shows when the scope line would be reached, which gives an evidence-based forecast and supports a conversation about priorities.",
  notes: ["The trend line does not reach total scope by sprint 10.", "", "Burn-up charts are designed for forecasting.", "Overtime is not a sustainable plan and ignores the data."] });
Q({ id: "q024", d: PE, t: 6, ap: "P", type: "mc",
  stem: "The sponsor asks you to shorten the schedule by 20% without changing scope. What should you do first?",
  opts: ["Agree and ask the team to work faster", "Analyse schedule compression options, such as crashing and fast-tracking, and present their costs, risks and feasibility to the sponsor", "Refuse because the schedule baseline is approved", "Remove low-priority scope without telling the sponsor"],
  ans: 1, why: "Manage expectations with analysis: show what compression is possible and at what cost and risk, so the sponsor can make an informed decision.",
  notes: ["Agreeing without analysis sets the team up to fail.", "", "The baseline can change through change control if justified.", "Changing scope without approval breaks trust and process."] });
Q({ id: "q025", d: PE, t: 7, ap: "P", type: "mc",
  stem: "When should lessons learned be collected on a predictive project?",
  opts: ["Only at project closure", "Throughout the project, with the lessons learned register updated regularly and lessons shared at phase ends and closure", "Only when something goes wrong", "Only when the sponsor requests them"],
  ans: 1, why: "Lessons learned are captured throughout the project, so they can improve the current project as well as future ones.",
  notes: ["Waiting until closure loses detail and benefit.", "", "Successes are lessons too.", "Lessons learned are routine, not on request."] });
Q({ id: "q026", d: PE, t: 7, ap: "A", type: "mc",
  stem: "Only one developer understands the payment integration code. The team is worried about what happens if she is unavailable. What is the BEST approach?",
  opts: ["Ask her to write comprehensive documentation of the entire system", "Introduce pairing or mob programming on the payment code and rotate who works on it", "Reduce her workload so she is less likely to leave", "Ask the sponsor to approve a retention bonus"],
  ans: 1, why: "Pairing and rotation spread tacit knowledge quickly and keep it current. Documentation helps, but working together transfers knowledge more effectively.",
  notes: ["Comprehensive documentation is slow and quickly goes out of date.", "", "This does not reduce the single point of failure.", "Retention may help but does not transfer knowledge."] });
Q({ id: "q027", d: PE, t: 7, ap: "H", type: "mc",
  stem: "A new hospital records system is about to go live. The vendor's project team leaves in two weeks, and the hospital's IT team will support the system. What should the project manager prioritise?",
  opts: ["Sending the hospital the final status report", "A knowledge transfer plan including training, runbooks and the hospital team shadowing the vendor team before go-live", "Extending the vendor contract indefinitely", "Asking the hospital to hire the vendor's developers"],
  ans: 1, why: "Transition to operations requires structured knowledge transfer: training, documentation and hands-on shadowing.",
  notes: ["A status report does not transfer operational knowledge.", "", "This avoids, rather than plans, the transition.", "This is not within the project's authority or scope."] });
Q({ id: "q028", d: PE, t: 8, ap: "P", type: "drop",
  stem: "A project team grows from 8 to 12 people. The number of potential communication channels increases by [ ].",
  opts: ["4", "28", "38", "66"], ans: 2,
  why: "Channels = n(n − 1) ÷ 2. For 8 people: 28. For 12 people: 66. The increase is 66 − 28 = 38." });
Q({ id: "q029", d: PE, t: 8, ap: "P", type: "mc",
  stem: "A water project will affect a rural community where many residents do not read English. The project manager needs to explain construction disruptions. What is the MOST appropriate method?",
  opts: ["Post notices in English at the community centre", "Hold community meetings in the local language, supported by the community leaders", "Email updates to community leaders", "Publish updates on the project website"],
  ans: 1, why: "Communication methods must suit the audience. Meetings in the local language, through trusted leaders, are interactive and accessible.",
  notes: ["Written English excludes many residents.", "", "Email reaches only a few people.", "A website is pull communication and may not be accessible."] });
Q({ id: "q030", d: PE, t: 8, ap: "H", type: "mc",
  stem: "The project manager must tell the team that the project budget is being cut and some roles will move to other projects. Which communication method is MOST appropriate?",
  opts: ["Push communication by email", "Pull communication on the project intranet", "Interactive communication in a meeting, followed by written confirmation", "A notice on the team's information radiator"],
  ans: 2, why: "Sensitive or complex messages need interactive communication so people can ask questions; written follow-up provides a record.",
  notes: ["Email alone is impersonal for sensitive news.", "Pull communication may not reach everyone.", "", "A board notice is inappropriate for sensitive news."] });
Q({ id: "q031", d: PE, t: 8, ap: "A", type: "mc",
  stem: "What is the main purpose of an information radiator, such as a visible task board or burndown chart, in an agile team area?",
  opts: ["To give managers a way to monitor individual performance", "To make progress and problems visible to the team and stakeholders without the need to ask", "To replace sprint reviews", "To store project documents"],
  ans: 1, why: "Information radiators provide transparency, so anyone can see the team's progress and impediments at a glance.",
  notes: ["They are about team transparency, not individual surveillance.", "", "Reviews involve inspecting the product; radiators do not replace them.", "Documents belong in a repository."] });
Q({ id: "q032", d: PE, t: 8, ap: "P", type: "match",
  stem: "Match each communication method to the example that best fits it.",
  left: ["Interactive communication", "Push communication", "Pull communication"],
  right: ["A video call to agree a change in approach", "A weekly status report emailed to stakeholders", "A lessons-learned library on the intranet that people consult when needed"],
  ans: [0, 1, 2], why: "Interactive is two-way and real-time; push is sent to recipients; pull is accessed by recipients when they choose." });
Q({ id: "q033", d: PE, t: 8, ap: "P", type: "mc",
  stem: "A department head complains that she was not told about a schedule change that affects her staff. What should the project manager do first?",
  opts: ["Apologise and send her every project document", "Review the communications management plan and stakeholder register to understand why she was missed, then update them", "Ask her to check the project website regularly", "Escalate to the sponsor"],
  ans: 1, why: "A missed stakeholder points to a gap in the communications plan or stakeholder analysis. Fix the cause, not just the symptom.",
  notes: ["Sending everything overwhelms rather than informs.", "", "Pull communication may not suit her needs.", "There is nothing to escalate yet."] });

// ---------------- PROCESS ----------------
Q({ id: "q034", d: PR, t: 1, ap: "P", type: "mc",
  stem: "Who should issue the project charter, formally authorising the project and the project manager's authority to apply resources?",
  opts: ["The project manager", "The project sponsor or initiator", "The PMO analyst", "The lead engineer"],
  ans: 1, why: "The charter is issued by the sponsor or an initiator at an appropriate level, outside the project. It authorises the project and names the project manager.",
  notes: ["The project manager may help draft it but does not authorise it.", "", "A PMO may support but does not authorise the project.", "Team members do not authorise projects."] });
Q({ id: "q035", d: PR, t: 1, ap: "P", type: "mr", pick: 3,
  stem: "Which THREE baselines are part of the project management plan on a predictive project?",
  opts: ["Scope baseline", "Risk register", "Schedule baseline", "Issue log", "Cost baseline", "Quality metrics"],
  ans: [0, 2, 4], why: "The scope, schedule and cost baselines (together the performance measurement baseline) are part of the project management plan. Registers and logs are project documents.",
  notes: ["", "The risk register is a project document.", "", "The issue log is a project document.", "", "Quality metrics are a project document."] });
Q({ id: "q036", d: PR, t: 1, ap: "H", type: "mc",
  stem: "A project will install medical devices that must meet fixed regulatory specifications and build patient-facing software whose requirements are expected to evolve. Which delivery approach is MOST appropriate?",
  opts: ["Predictive for the whole project", "Agile for the whole project", "Hybrid: predictive for the regulated device installation and agile for the software", "Choose the approach after the first deliverable is complete"],
  ans: 2, why: "Tailoring the approach to each component's characteristics is good practice. Stable, regulated work suits predictive delivery; evolving requirements suit agile.",
  notes: ["Predictive handles evolving software requirements poorly.", "Agile alone may not suit fixed regulatory work and approvals.", "", "The approach should be chosen during planning."] });
Q({ id: "q037", d: PR, t: 1, ap: "H", type: "mc",
  stem: "A project manager joins an organisation that has a large standard methodology. The new project is small and low-risk. What should the project manager do?",
  opts: ["Apply every process in the methodology to ensure compliance", "Tailor the methodology to the project's size, risk and complexity, within the organisation's governance requirements", "Ignore the methodology because the project is small", "Ask the team to choose any process they like"],
  ans: 1, why: "Tailoring selects and adapts processes to the project while respecting governance. One size does not fit all.",
  notes: ["Applying everything adds unnecessary overhead.", "", "Ignoring it breaches governance.", "Tailoring is guided, not a free-for-all."] });
Q({ id: "q038", d: PR, t: 2, ap: "P", type: "drop",
  stem: "In a work breakdown structure, the lowest level at which cost and duration can be estimated and managed is called the [ ].",
  opts: ["control account", "work package", "planning package", "activity"], ans: 1,
  why: "The work package is the lowest level of the WBS. Activities are defined later in schedule management, by decomposing work packages." });
Q({ id: "q039", d: PR, t: 2, ap: "P", type: "mc",
  stem: "The quality team has verified that a deliverable meets its specifications. What must happen next for the customer to formally accept it?",
  opts: ["Control quality", "Validate scope, with the customer or sponsor reviewing and accepting the deliverable", "Close the project", "Perform a quality audit"],
  ans: 1, why: "Control quality checks correctness; validate scope obtains formal acceptance from the customer or sponsor.",
  notes: ["Control quality has already happened.", "", "Closure comes after acceptance of all deliverables.", "An audit reviews processes, not deliverable acceptance."] });
Q({ id: "q040", d: PR, t: 2, ap: "A", type: "mc",
  stem: "A stakeholder identifies a new requirement for a mobile banking app halfway through the release. Where should it go?",
  opts: ["Straight into the current sprint", "To the product owner, who adds it to the product backlog and prioritises it against existing items", "To the change control board for approval", "Nowhere; scope is fixed for the release"],
  ans: 1, why: "In agile delivery, new requirements go to the product owner for the product backlog, where they are prioritised by value.",
  notes: ["Adding to the current sprint disrupts the sprint goal.", "", "Agile teams generally manage scope through the backlog, not a change board.", "Agile welcomes changing requirements."] });
Q({ id: "q041", d: PR, t: 2, ap: "P", type: "mc",
  stem: "A project manager wants to make sure every requirement links to a business objective and is tested before delivery. Which tool should be used?",
  opts: ["Requirements traceability matrix", "Stakeholder register", "Responsibility assignment matrix", "Change log"],
  ans: 0, why: "A requirements traceability matrix links each requirement to its origin and follows it through design, build and test.",
  notes: ["", "The stakeholder register records stakeholders.", "A RAM records responsibilities.", "The change log records change requests."] });
Q({ id: "q042", d: PR, t: 3, ap: "A", type: "mc",
  stem: "What is the main purpose of a minimum viable product (MVP)?",
  opts: ["To deliver the cheapest possible product", "To deliver the smallest product that lets the team test its key assumptions and start delivering value with real users", "To satisfy the contract with minimal effort", "To demonstrate the team's technical skills"],
  ans: 1, why: "An MVP tests assumptions and delivers value early, so the product can be improved based on real feedback.",
  notes: ["Cost is not the aim; learning and value are.", "", "An MVP is about learning, not minimal compliance.", "It is not a technical showcase."] });
Q({ id: "q043", d: PR, t: 3, ap: "A", type: "mc",
  stem: "A product owner has twenty backlog items and a fixed release date. How should the items be ordered?",
  opts: ["By the size of each item, smallest first", "By business value, considering risk, dependencies and cost of delay", "In the order stakeholders requested them", "By which developer is available"],
  ans: 1, why: "Value-based prioritisation delivers the most important outcomes first, taking risk, dependencies and cost of delay into account.",
  notes: ["Size alone does not reflect value.", "", "Request order ignores value.", "Ordering by availability serves the team, not the customer."] });
Q({ id: "q044", d: PR, t: 3, ap: "A", type: "mc",
  stem: "The sponsor wants to know whether an agile project is delivering value. Which measure is MOST useful?",
  opts: ["The team's velocity", "The number of hours worked", "Business outcomes from released features, such as adoption and the agreed value metrics", "The number of stories completed"],
  ans: 2, why: "Value is measured by outcomes for the business and customers, not by outputs such as velocity or effort.",
  notes: ["Velocity measures capacity, not value.", "Hours measure effort.", "", "Completed stories are output, not outcome."] });
Q({ id: "q045", d: PR, t: 3, ap: "P", type: "mc",
  stem: "A project to deliver a new clinic has finished. The benefits, such as patient numbers and reduced travel times, will appear over the next two years. Who is typically responsible for measuring them?",
  opts: ["The project manager, after closure", "The business owner or sponsor, as defined in the benefits management plan", "The contractor", "Nobody; benefits are measured only at closure"],
  ans: 1, why: "Benefits are often realised after the project closes, so ownership sits with the business, as set out in the benefits management plan.",
  notes: ["The project manager's role usually ends at closure.", "", "The contractor delivers outputs, not benefits.", "Benefits often take time to realise."] });
Q({ id: "q046", d: PR, t: 4, ap: "P", type: "mc",
  stem: "A resource histogram shows the electrician is scheduled for 60 hours in week 9. The project manager adjusts activity dates so the electrician is not over-allocated, even though the project end date moves out by a week. What technique has been used?",
  opts: ["Resource smoothing", "Resource levelling", "Fast-tracking", "Crashing"],
  ans: 1, why: "Resource levelling resolves over-allocation and can change the critical path and end date. Resource smoothing works only within float.",
  notes: ["Smoothing would not delay the end date.", "", "Fast-tracking overlaps activities.", "Crashing adds resources to shorten duration."] });
Q({ id: "q047", d: PR, t: 4, ap: "P", type: "mc",
  stem: "In a RACI chart, how many people should be 'Accountable' for each activity?",
  opts: ["As many as necessary", "Exactly one", "At least two, for cover", "None; accountability belongs to the team"],
  ans: 1, why: "Each activity should have exactly one accountable person to avoid confusion about who has the final say.",
  notes: ["Several accountable people blur ownership.", "", "Cover is achieved through responsible roles, not shared accountability.", "Clear accountability is the point of RACI."] });
Q({ id: "q048", d: PR, t: 4, ap: "A", type: "mc",
  stem: "Two developers will be on leave for half of the next two-week sprint. How should this affect sprint planning?",
  opts: ["It should not; velocity already allows for leave", "The team should plan for reduced capacity and commit to less work this sprint", "The product owner should find replacements", "The sprint should be cancelled"],
  ans: 1, why: "Capacity planning accounts for known availability. Committing to the usual velocity with fewer people risks missing the sprint goal.",
  notes: ["Average velocity does not account for unusual absences.", "", "Finding replacements is not the product owner's role and may not help quickly.", "Reduced capacity does not justify cancelling a sprint."] });
Q({ id: "q049", d: PR, t: 4, ap: "H", type: "mc",
  stem: "A project needs a data analyst skilled in a tool nobody on the team knows. The organisation has a training budget and the project has three months before the analysis starts. What is the BEST option to consider first?",
  opts: ["Hire an external consultant immediately", "Assess whether training an existing team member in time is feasible and cost-effective, and update the resource management plan", "Drop the analysis from scope", "Ask the sponsor to find someone"],
  ans: 1, why: "Developing team capabilities is a valid resource strategy when time and budget allow. Assess options before acquiring external resources.",
  notes: ["Hiring may be needed, but compare options first.", "", "Removing scope requires change control and loses value.", "Resource planning is the project manager's responsibility."] });
Q({ id: "q050", d: PR, t: 5, ap: "P", type: "match",
  stem: "Match each contract type to the statement that best describes it.",
  left: ["Firm fixed price", "Cost plus fixed fee", "Time and materials", "Fixed price incentive fee"],
  right: ["The seller carries most of the cost risk", "The buyer carries most of the cost risk", "Suits staff augmentation or work where the scope is not yet clear", "Rewards the seller for beating agreed performance targets"],
  ans: [0, 1, 2, 3], why: "Fixed-price contracts put cost risk on the seller; cost-reimbursable contracts put it on the buyer; time and materials sits between and suits unclear scope; incentive fees reward performance." });
Q({ id: "q051", d: PR, t: 5, ap: "P", type: "mc",
  stem: "A contractor submits a claim for extra payment, saying the buyer's late approvals caused delays. The buyer disagrees. What should happen first?",
  opts: ["Pay the claim to protect the relationship", "Handle it through claims administration under the contract, reviewing records and negotiating; use alternative dispute resolution if needed", "Terminate the contract", "Ignore the claim until project closure"],
  ans: 1, why: "Claims are managed under the contract's terms, through documented review and negotiation. Alternative dispute resolution is preferred to litigation.",
  notes: ["Paying without review may waste money.", "", "Termination is disproportionate.", "Unresolved claims delay closure and escalate costs."] });
Q({ id: "q052", d: PR, t: 5, ap: "P", type: "mc",
  stem: "A project needs a specialised testing laboratory for three months. The organisation is considering whether to build its own lab or hire one. What technique should be used?",
  opts: ["Make-or-buy analysis", "Earned value analysis", "Expected monetary value analysis only", "Bidder conference"],
  ans: 0, why: "Make-or-buy analysis compares the costs, risks and benefits of producing internally or procuring externally.",
  notes: ["", "EVM measures performance, not sourcing decisions.", "EMV may support the analysis but is not the technique itself.", "A bidder conference comes after the decision to buy."] });
Q({ id: "q053", d: PR, t: 5, ap: "P", type: "mc",
  stem: "What is the main purpose of a bidder conference?",
  opts: ["To negotiate prices with the preferred bidder", "To make sure all prospective sellers have the same clear understanding of the procurement requirements", "To select the winning seller", "To let bidders meet the project team socially"],
  ans: 1, why: "Bidder conferences give every prospective seller the same information, which supports fair and competitive bidding.",
  notes: ["Negotiation comes later, with selected sellers.", "", "Selection follows evaluation of proposals.", "The purpose is fairness and clarity."] });
Q({ id: "q054", d: PR, t: 5, ap: "H", type: "mc",
  stem: "A software vendor keeps delivering features late and with defects, below the standards in the contract. What should the project manager do first?",
  opts: ["Withhold all payments immediately", "Review performance against the contract terms, document the shortfalls and raise them formally with the vendor to agree corrective action", "Hire a second vendor to do the same work", "Terminate the contract"],
  ans: 1, why: "Control procurements by measuring performance against the contract and addressing shortfalls formally, using the contract's provisions.",
  notes: ["Withholding payment without following the contract may breach it.", "", "Duplicating work wastes money.", "Termination is a last resort."] });
Q({ id: "q055", d: PR, t: 6, ap: "P", type: "graph", fig: "evm",
  stem: "The chart shows planned value, earned value and actual cost at week 20 of a project. What is the cost performance index (CPI) at week 20?",
  opts: ["0.80", "0.89", "1.13", "1.25"],
  ans: 0, why: "CPI = EV ÷ AC = ₦160m ÷ ₦200m = 0.80. The project is getting ₦0.80 of value for every naira spent.",
  notes: ["", "0.89 is EV ÷ PV (the SPI).", "1.13 is PV ÷ EV.", "1.25 is AC ÷ EV."] });
Q({ id: "q056", d: PR, t: 6, ap: "P", type: "mc",
  stem: "A project's budget at completion is ₦500 million and its CPI is 0.80. If the current cost performance continues, what is the estimate at completion?",
  opts: ["₦400 million", "₦500 million", "₦580 million", "₦625 million"],
  ans: 3, why: "EAC = BAC ÷ CPI = ₦500m ÷ 0.80 = ₦625m.",
  notes: ["That multiplies BAC by CPI.", "That assumes no variance.", "That doesn't follow from the formula.", ""] });
Q({ id: "q057", d: PR, t: 6, ap: "P", type: "drop",
  stem: "A to-complete performance index (TCPI) of 1.20 means the remaining work must be completed at a cost efficiency [ ] than the project has planned.",
  opts: ["20% lower", "20% higher", "equal to", "with no relation to"], ans: 1,
  why: "TCPI shows the cost efficiency needed on the remaining work to meet the target. Above 1.0 means the team must perform more efficiently than planned, which is hard to achieve." });
Q({ id: "q058", d: PR, t: 6, ap: "P", type: "mc",
  stem: "An unidentified problem requires additional funds beyond the project's contingency reserve. How can the project manager access the management reserve?",
  opts: ["Draw on it directly, since it is part of the project budget", "Submit a change request; management reserve is controlled by management or the sponsor", "Use money from another project", "Reduce scope without approval to free funds"],
  ans: 1, why: "Management reserve sits outside the cost baseline for unknown-unknowns, and using it requires approval through change control.",
  notes: ["The project manager controls contingency, not management reserve.", "", "Using another project's money is improper.", "Unapproved scope reduction breaks change control."] });
Q({ id: "q059", d: PR, t: 6, ap: "P", type: "mr", pick: 2,
  stem: "Which TWO are costs of conformance in the cost of quality?",
  opts: ["Training for the team", "Rework of defective work", "Inspections and testing", "Warranty claims", "Scrap"],
  ans: [0, 2], why: "Costs of conformance are prevention (such as training) and appraisal (such as testing and inspection). Rework, warranty claims and scrap are costs of non-conformance (failure costs).",
  notes: ["", "Rework is an internal failure cost.", "", "Warranty claims are an external failure cost.", "Scrap is an internal failure cost."] });
Q({ id: "q060", d: PR, t: 7, ap: "P", type: "graph", fig: "control",
  stem: "The control chart shows the thickness of concrete slabs measured over 12 pours. All points are within the control limits. What should the project manager conclude?",
  opts: ["The process is in control, so no action is needed", "The process may be out of control, because seven or more consecutive points fall on one side of the mean, and should be investigated", "The specification limits are wrong", "The measurements must be faulty"],
  ans: 1, why: "The rule of seven: seven consecutive points on one side of the mean suggest a non-random cause, even within the control limits.",
  notes: ["Points within limits can still show a non-random pattern.", "", "Specification limits are set by the customer, not by this data.", "There is no evidence the measurements are faulty."] });
Q({ id: "q061", d: PR, t: 7, ap: "P", type: "mc",
  stem: "What is the main purpose of a quality audit?",
  opts: ["To inspect deliverables for defects", "To check whether project activities follow organisational and project policies, processes and procedures, and to identify good practices and gaps", "To obtain customer acceptance", "To measure the team's productivity"],
  ans: 1, why: "Quality audits review processes, as part of managing quality, and identify improvements. Inspection of deliverables is part of control quality.",
  notes: ["Inspection belongs to control quality.", "", "Acceptance belongs to validate scope.", "Productivity is not the focus of a quality audit."] });
Q({ id: "q062", d: PR, t: 7, ap: "A", type: "mc",
  stem: "How do agile teams typically ensure quality is built into their work?",
  opts: ["By a separate quality team testing at the end of the release", "Through a shared definition of done, frequent testing such as test-driven development and continuous integration, and regular feedback", "By extending the final sprint for testing", "By the product owner approving the code"],
  ans: 1, why: "Agile teams build quality in continuously, using a definition of done, automated testing and frequent feedback.",
  notes: ["Testing only at the end is late and costly.", "", "A testing sprint at the end is an anti-pattern.", "The product owner accepts features, not code quality."] });
Q({ id: "q063", d: PR, t: 7, ap: "P", type: "mc",
  stem: "Defects in welded joints keep recurring. The project manager wants to explore possible causes across people, methods, materials and equipment. Which tool is MOST suitable?",
  opts: ["Pareto chart", "Cause-and-effect (Ishikawa) diagram", "Histogram", "Scatter diagram"],
  ans: 1, why: "A cause-and-effect diagram organises potential causes into categories to support root cause analysis.",
  notes: ["A Pareto chart ranks causes by frequency, after they are known.", "", "A histogram shows distribution.", "A scatter diagram shows a relationship between two variables."] });
Q({ id: "q064", d: PR, t: 8, ap: "P", type: "hot", fig: "network",
  stem: "The network diagram shows activities with durations in days. Click any activity that would delay the project's finish date if it slipped by one day.",
  ans: ["A", "C", "E"], why: "The critical path is Start–A–C–E–End (4 + 7 + 5 = 16 days), so A, C and E have zero float. Path A–B–D takes 13 days, so B and D have 3 days of float." });
Q({ id: "q065", d: PR, t: 8, ap: "P", type: "mc",
  stem: "Activity A (3 days) starts the project. B (4 days) and C (6 days) both follow A. D (5 days) follows both B and C. What is the project duration?",
  opts: ["12 days", "14 days", "15 days", "18 days"],
  ans: 1, why: "Path A–B–D = 12 days; path A–C–D = 14 days. The critical path is the longest: 14 days.",
  notes: ["That is the shorter path.", "", "That adds the wrong durations.", "That adds every activity."] });
Q({ id: "q066", d: PR, t: 8, ap: "P", type: "mc",
  stem: "A project is behind schedule. The project manager overlaps two activities that were planned to run one after the other. What is the main trade-off?",
  opts: ["Higher cost from added resources", "Increased risk of rework", "Reduced scope", "Lower quality standards"],
  ans: 1, why: "Fast-tracking runs activities in parallel, which increases the risk of rework. Crashing adds resources and therefore cost.",
  notes: ["That describes crashing.", "", "Scope is unchanged.", "Quality standards are not lowered by design, though rework risk rises."] });
Q({ id: "q067", d: PR, t: 8, ap: "A", type: "mc",
  stem: "A product backlog has 120 story points remaining for the release. The team's average velocity is 20 points per sprint. Approximately how many sprints are needed?",
  opts: ["4", "5", "6", "8"],
  ans: 2, why: "120 ÷ 20 = 6 sprints. In practice you would give a range, since velocity varies.",
  notes: ["", "", "", ""] });
Q({ id: "q068", d: PR, t: 8, ap: "P", type: "mc",
  stem: "Using a three-point (beta) estimate, what is the expected duration for an activity with an optimistic estimate of 4 days, most likely 6 days and pessimistic 14 days?",
  opts: ["6 days", "7 days", "8 days", "8.5 days"],
  ans: 1, why: "Beta (PERT) estimate = (O + 4M + P) ÷ 6 = (4 + 24 + 14) ÷ 6 = 7 days.",
  notes: ["That is the most likely value.", "", "That is the triangular average, (4 + 6 + 14) ÷ 3.", "That doesn't follow from either formula."] });
Q({ id: "q069", d: PR, t: 9, ap: "A", type: "graph", fig: "burndown",
  stem: "The sprint burndown chart shows remaining work. What does the pattern between days 3 and 6 MOST likely indicate?",
  opts: ["The team finished work early", "The team was blocked or work was not being completed, and the cause should be explored at the stand-up", "The product owner added scope", "The chart is being updated correctly"],
  ans: 1, why: "A flat burndown means no work is being completed. It often signals impediments, work stuck in progress or stories too large to finish.",
  notes: ["Early completion would show the line falling quickly.", "", "Added scope would make the line rise, not stay flat.", "The issue is the pattern, not the updating."] });
Q({ id: "q070", d: PR, t: 9, ap: "A", type: "graph", fig: "cfd",
  stem: "The cumulative flow diagram shows the number of items in each stage over time. What does it indicate?",
  opts: ["The team is delivering faster each week", "Work is building up in testing, a bottleneck that the team should address", "The backlog is shrinking", "Development is the bottleneck"],
  ans: 1, why: "A widening band means work is entering a stage faster than it leaves. Here the testing band widens while 'done' grows slowly.",
  notes: ["Done grows slowly, not faster.", "", "The backlog band is not the issue shown.", "The development band is steady, not widening."] });
Q({ id: "q071", d: PR, t: 9, ap: "P", type: "mc",
  stem: "A project has an SPI of 0.85 and a CPI of 1.10. What does this mean?",
  opts: ["Ahead of schedule and over budget", "Behind schedule and under budget", "Behind schedule and over budget", "Ahead of schedule and under budget"],
  ans: 1, why: "SPI below 1.0 means behind schedule; CPI above 1.0 means under budget for the work done.",
  notes: ["", "", "", ""] });
Q({ id: "q072", d: PR, t: 9, ap: "A", type: "mc",
  stem: "A Kanban team wants to know how long, on average, a request takes from the moment the customer asks for it until it is delivered. Which measure should it track?",
  opts: ["Velocity", "Lead time", "Cycle time", "Throughput"],
  ans: 1, why: "Lead time runs from the customer request to delivery. Cycle time runs from when work starts to when it finishes.",
  notes: ["Velocity is used in Scrum, not for individual items.", "", "Cycle time starts when work begins, not when it is requested.", "Throughput counts items completed per period."] });
Q({ id: "q073", d: PR, t: 10, ap: "P", type: "mc",
  stem: "All deliverables of a predictive project are complete. What should the project manager do FIRST in closing the project?",
  opts: ["Release the team", "Obtain formal acceptance of the deliverables from the customer or sponsor", "Archive project records", "Hold a celebration"],
  ans: 1, why: "Closure starts with formal acceptance. Contracts are then closed, lessons learned finalised, records archived and resources released.",
  notes: ["Releasing the team comes later.", "", "Archiving comes after acceptance and lessons learned.", "Celebrating is good, but not first."] });
Q({ id: "q074", d: PR, t: 10, ap: "H", type: "mc",
  stem: "Halfway through a project, the sponsor cancels it because the market has changed. What should the project manager do?",
  opts: ["Stop all work and move to a new project", "Follow the closing process: document the reasons, the status of deliverables and lessons learned, close contracts, and archive records", "Continue the project until the sponsor changes their mind", "Hand the work over to operations"],
  ans: 1, why: "Terminated projects still need formal closure, to capture knowledge, settle contracts and account for work completed.",
  notes: ["Walking away loses knowledge and leaves contracts open.", "", "The sponsor has the authority to terminate.", "There may be nothing ready to hand over."] });
Q({ id: "q075", d: PR, t: 10, ap: "A", type: "mc",
  stem: "An agile team has delivered the final release of a product. What should the team do as part of closure?",
  opts: ["Nothing; agile projects do not close", "Hold a final retrospective, transfer knowledge to the team that will maintain the product, and confirm acceptance with the product owner and stakeholders", "Write a detailed lessons learned report only", "Start the next product without any handover"],
  ans: 1, why: "Agile projects and releases close too: confirm acceptance, transition to operations and reflect on lessons.",
  notes: ["Releases and projects end and need transition.", "", "A report alone misses acceptance and transition.", "Skipping handover leaves operations unsupported."] });
Q({ id: "q076", d: PR, t: 10, ap: "P", type: "mc",
  stem: "A seller has finished all work under a contract, but one minor deliverable is disputed. What should happen before the contract is closed?",
  opts: ["Close the contract and resolve the dispute later", "Resolve the dispute through negotiation or the contract's dispute process, then formally close the contract", "Withhold all final payments indefinitely", "Ask the seller to drop the dispute"],
  ans: 1, why: "Contracts should be closed formally, with open claims and disputes settled beforehand where possible.",
  notes: ["Closing with open disputes leaves liabilities.", "", "Withholding indefinitely may breach the contract.", "Pressure is not a dispute resolution process."] });

// ---------------- BUSINESS ENVIRONMENT ----------------
Q({ id: "q077", d: BE, t: 1, ap: "P", type: "mc",
  stem: "A large programme has a review at the end of each phase where the steering committee decides whether to continue, change direction or stop. What is this review called?",
  opts: ["Sprint review", "Phase gate (stage gate) review", "Quality audit", "Retrospective"],
  ans: 1, why: "Phase gates are governance checkpoints where a decision is made about continuing the project.",
  notes: ["A sprint review inspects an increment.", "", "A quality audit reviews processes.", "A retrospective improves the team's ways of working."] });
Q({ id: "q078", d: BE, t: 1, ap: "H", type: "mc",
  stem: "In one organisation, the PMO assigns project managers, directly manages projects and holds a high degree of control. What type of PMO is this?",
  opts: ["Supportive", "Controlling", "Directive", "Advisory"],
  ans: 2, why: "A directive PMO directly manages projects (high control). A controlling PMO requires compliance (moderate control); a supportive PMO advises (low control).",
  notes: ["Supportive PMOs have low control.", "Controlling PMOs require compliance but don't manage projects directly.", "", "Advisory is not one of the standard three types."] });
Q({ id: "q079", d: BE, t: 1, ap: "H", type: "mc",
  stem: "A decision is needed that exceeds the project manager's authority as defined in the project's governance framework. What should the project manager do?",
  opts: ["Make the decision to avoid delay", "Escalate it, with the analysis and a recommendation, through the path defined in the governance framework", "Ask the team to vote", "Wait until the next scheduled steering meeting regardless of urgency"],
  ans: 1, why: "Governance defines decision rights and escalation paths. Escalate with analysis and a recommendation to make the decision easier.",
  notes: ["Acting beyond your authority breaches governance.", "", "A team vote does not have the authority either.", "Urgent decisions may need the defined escalation route, not the next meeting."] });
Q({ id: "q080", d: BE, t: 2, ap: "H", type: "mc",
  stem: "Midway through a customer data platform project, the Nigeria Data Protection Commission issues new guidance that affects how the platform must store consent records. What should the project manager do first?",
  opts: ["Continue as planned; the guidance came after approval", "Assess the impact of the guidance with the compliance team, update the requirements and compliance plan, and process the changes through change control", "Ask the regulator for an exemption", "Stop the project until the guidance is clarified"],
  ans: 1, why: "Compliance with regulation is mandatory. Assess the impact, then update requirements and plans through the agreed process.",
  notes: ["Regulations apply regardless of when the project was approved.", "", "Exemptions are unlikely and avoid the work.", "Stopping is premature before an impact assessment."] });
Q({ id: "q081", d: BE, t: 2, ap: "P", type: "mc",
  stem: "A client requires that the new office building reduce its operational carbon emissions by 30%. How should the project manager handle this requirement?",
  opts: ["Treat it as a nice-to-have if the budget allows", "Include it as a requirement with measurable acceptance criteria, and reflect it in the design, quality and procurement criteria", "Leave it for the facilities team after handover", "Ask the contractor to decide how to meet it"],
  ans: 1, why: "Sustainability requirements should be explicit and measurable, built into design, quality metrics and procurement, as other requirements are.",
  notes: ["The client made it a requirement.", "", "Operational emissions are largely fixed by design decisions.", "The contractor must meet the requirement, but the project defines it."] });
Q({ id: "q082", d: BE, t: 2, ap: "A", type: "mc",
  stem: "A project manager discovers that a team member altered test results so a release would pass a compliance gate. What should the project manager do?",
  opts: ["Correct the results quietly and talk to the team member later", "Address it immediately: stop the release, report it according to organisational policy and the PMI Code of Ethics, and correct the record", "Ignore it if the release works in production", "Let the team decide how to handle it in the retrospective"],
  ans: 1, why: "Falsifying records is an ethical and compliance breach. Act promptly, report through proper channels and ensure accurate information.",
  notes: ["Quietly correcting it hides misconduct.", "", "A working release does not excuse falsified compliance evidence.", "This is not a team-process issue for a retrospective."] });
Q({ id: "q083", d: BE, t: 2, ap: "P", type: "mc",
  stem: "On a site visit, the project manager sees workers on a high scaffold without harnesses. What should the project manager do FIRST?",
  opts: ["Note it for the next site meeting", "Stop the unsafe work immediately and make sure safety measures are in place", "Email the contractor about the breach", "Analyse the impact on the schedule"],
  ans: 1, why: "Immediate risks to life take priority over analysis and process. Stop the work, then investigate and prevent a recurrence.",
  notes: ["Waiting leaves people in danger.", "", "Writing to the contractor doesn't stop the immediate danger.", "Safety comes before schedule analysis."] });
Q({ id: "q084", d: BE, t: 3, ap: "P", type: "drop",
  stem: "In a predictive project, formal change requests to the baselines are approved or rejected by the [ ], according to the change management plan.",
  opts: ["project team", "change control board", "product owner", "quality assurance team"], ans: 1,
  why: "The change control board, or another authority named in the change management plan, decides on change requests." });
Q({ id: "q085", d: BE, t: 3, ap: "P", type: "mc",
  stem: "A project manager finds that a team member has added an extra report to a deliverable because the client mentioned it informally. It was not in the approved scope. What should the project manager do?",
  opts: ["Thank the team member for their initiative", "Explain that changes must go through change control, and raise a change request if the report is genuinely needed", "Remove the report and discipline the team member", "Ask the client to pay for the report"],
  ans: 1, why: "Uncontrolled additions are scope creep. Use change control so the impact is assessed and the change is approved properly.",
  notes: ["Praising scope creep encourages more of it.", "", "Disciplinary action is excessive; coaching is better.", "Charging without an agreed change is premature."] });
Q({ id: "q086", d: BE, t: 3, ap: "A", type: "mc",
  stem: "During a sprint, a senior stakeholder asks a developer directly to change how a completed feature works. What should happen?",
  opts: ["The developer should make the change immediately", "The request should go to the product owner, who decides whether and when to add it to the product backlog", "The project manager should approve the change", "The change should wait until the release is complete"],
  ans: 1, why: "In agile delivery, the product owner manages changes to the product through the backlog. This protects the sprint and keeps priorities clear.",
  notes: ["Bypassing the product owner disrupts the sprint.", "", "In agile delivery the product owner owns this decision.", "Changes can be prioritised sooner if valuable."] });
Q({ id: "q087", d: BE, t: 3, ap: "P", type: "mc",
  stem: "A project manager receives a change request from the client. What should be done FIRST?",
  opts: ["Implement the change", "Analyse the change's impact on scope, schedule, cost, quality and risk", "Send it to the change control board", "Reject it to protect the baseline"],
  ans: 1, why: "Impact analysis comes first, so the change control board can make an informed decision.",
  notes: ["Never implement before approval.", "", "The board needs the impact analysis before it can decide.", "Changes are controlled, not automatically rejected."] });
Q({ id: "q088", d: BE, t: 4, ap: "P", type: "mc",
  stem: "What is the main difference between an issue log and a risk register?",
  opts: ["There is no difference", "An issue log records problems that are happening now; a risk register records uncertain events that may happen", "A risk register is used only for positive events", "An issue log is used only in agile projects"],
  ans: 1, why: "Issues are current problems needing action; risks are uncertain future events, positive or negative.",
  notes: ["They serve different purposes.", "", "Risk registers include threats and opportunities.", "Issue logs are used in every approach."] });
Q({ id: "q089", d: BE, t: 4, ap: "A", type: "mc",
  stem: "An agile team cannot test on real devices because the organisation's procurement department has delayed buying them for six weeks. What should the project manager do?",
  opts: ["Ask the team to test only on emulators until the devices arrive", "Work with the procurement department and management to remove the impediment, for example by expediting the order or arranging a temporary alternative", "Record it in the retrospective and wait", "Ask the product owner to remove testing from the definition of done"],
  ans: 1, why: "Removing organisational impediments that the team cannot resolve itself is a core servant-leadership responsibility.",
  notes: ["Emulators may help temporarily, but the impediment remains.", "", "Waiting accepts a six-week delay.", "Weakening the definition of done lowers quality."] });
Q({ id: "q090", d: BE, t: 4, ap: "H", type: "mc",
  stem: "The same integration failure has happened three times in two months, each time fixed by a workaround. What should the project manager do?",
  opts: ["Keep applying the workaround, since it works", "Lead a root cause analysis, address the underlying cause, and record the issue and the lesson", "Escalate to the vendor's CEO", "Remove the integration from scope"],
  ans: 1, why: "Recurring issues need root cause analysis and a lasting fix; workarounds treat symptoms.",
  notes: ["Repeated workarounds waste effort and hide the cause.", "", "Escalation before analysis is premature.", "Removing scope needs change control and loses value."] });
Q({ id: "q091", d: BE, t: 5, ap: "P", type: "match",
  stem: "Match each risk response to the example that best illustrates it.",
  left: ["Avoid", "Transfer", "Mitigate", "Accept", "Escalate"],
  right: ["Change the route of a pipeline so it no longer crosses a flood plain", "Buy insurance against damage to imported equipment in transit", "Add drainage to reduce the chance and impact of flooding on site", "Set aside a contingency reserve and do nothing else unless the risk occurs", "Pass a risk outside the project's authority to the programme board"],
  ans: [0, 1, 2, 3, 4], why: "Avoid removes the threat; transfer shifts its ownership; mitigate reduces probability or impact; accept acknowledges it (often with reserve); escalate passes it to the right level." });
Q({ id: "q092", d: BE, t: 5, ap: "P", type: "mc",
  stem: "A risk identified in the risk register has occurred. The register includes a planned response. What should the project manager do?",
  opts: ["Hold a meeting to identify new responses", "Implement the planned risk response", "Escalate to the sponsor", "Record it in the lessons learned register and continue"],
  ans: 1, why: "When an identified risk occurs, implement the agreed response from the plan. That is why responses are planned.",
  notes: ["The response has already been planned.", "", "Escalation is not needed if the plan covers it.", "Lessons learned come later."] });
Q({ id: "q093", d: BE, t: 5, ap: "H", type: "mc",
  stem: "An event nobody anticipated disrupts the project. It was not in the risk register. What should the project manager do?",
  opts: ["Implement a workaround to deal with the immediate impact, then add the event to the risk register and review whether similar risks exist", "Use the contingency reserve automatically", "Stop the project until a full risk assessment is complete", "Ignore it because it was not planned"],
  ans: 0, why: "Unplanned negative events need a workaround. Afterwards, update the risk register and look for related risks.",
  notes: ["", "Contingency reserve is intended for identified risks; unknowns may need management reserve via change control.", "Stopping everything is usually disproportionate.", "Ignoring it allows the impact to grow."] });
Q({ id: "q094", d: BE, t: 5, ap: "A", type: "mc",
  stem: "A supplier offers early delivery of a component if the team can accept it two weeks sooner. Taking it would let the team release an important feature a sprint early. Which opportunity response is being used if the team rearranges work to make sure this happens?",
  opts: ["Enhance", "Exploit", "Share", "Accept"],
  ans: 1, why: "Exploiting an opportunity means acting to make sure it definitely happens. Enhancing increases its probability or impact; sharing gives part of it to a third party.",
  notes: ["Enhancing raises the probability but doesn't ensure it.", "", "Sharing involves a partner.", "Accepting means taking no special action."] });
Q({ id: "q095", d: BE, t: 5, ap: "P", type: "mc",
  stem: "A risk has a 30% probability of occurring and would cost ₦20 million if it did. What is its expected monetary value?",
  opts: ["₦6 million", "₦14 million", "₦20 million", "₦26 million"],
  ans: 0, why: "EMV = probability × impact = 0.30 × ₦20m = ₦6m.",
  notes: ["", "That is the impact minus the EMV.", "That is the full impact.", "That adds instead of multiplying."] });
Q({ id: "q096", d: BE, t: 6, ap: "A", type: "mc",
  stem: "What should a team retrospective produce?",
  opts: ["A list of individuals who caused problems", "One or more specific, actionable improvements that the team commits to trying", "A new product backlog", "A performance appraisal for each team member"],
  ans: 1, why: "Retrospectives exist to improve the team's process through a small number of concrete actions the team owns.",
  notes: ["Blame destroys psychological safety.", "", "The backlog belongs to the product owner.", "Retrospectives are not appraisals."] });
Q({ id: "q097", d: BE, t: 6, ap: "P", type: "mc",
  stem: "A project manager notices that a team on a previous project solved a recurring procurement delay by pre-qualifying suppliers. How should this knowledge be used?",
  opts: ["Mention it informally to the procurement lead", "Check the organisation's lessons learned repository, apply the practice where it fits, and update the repository with the results", "Ignore it; every project is different", "Ask the previous project manager to join the current project"],
  ans: 1, why: "Continuous improvement uses organisational knowledge: apply relevant lessons and add new ones to the repository.",
  notes: ["Informal mentions may be lost.", "", "Many lessons transfer between projects.", "Borrowing the person is not practical or scalable."] });
Q({ id: "q098", d: BE, t: 7, ap: "H", type: "mc",
  stem: "Clinic staff are resisting a new electronic records system, saying it slows them down. Go-live is in six weeks. What should the project manager do first?",
  opts: ["Ask the hospital director to make use of the system mandatory", "Meet the staff to understand their concerns, then update the change management activities, such as training, workflow adjustments and champions on each ward", "Delay go-live by six months", "Proceed with go-live; staff will adapt"],
  ans: 1, why: "Organisational change succeeds when people's concerns are understood and addressed through engagement, training and support.",
  notes: ["Mandating use without addressing concerns drives poor adoption.", "", "A long delay is premature before understanding the issue.", "Ignoring resistance risks failure after go-live."] });
Q({ id: "q099", d: BE, t: 7, ap: "P", type: "mc",
  stem: "The organisation announces a restructuring that will merge two departments your project depends on. What should the project manager do?",
  opts: ["Continue the project as planned", "Assess the impact on stakeholders, resources, requirements and governance, then update the plan and engage the new department leaders", "Pause the project until the restructuring is complete", "Ask the sponsor to reverse the restructuring"],
  ans: 1, why: "Organisational changes affect projects. Assess the impact, update plans and re-engage the affected stakeholders.",
  notes: ["Ignoring it risks wrong assumptions.", "", "Pausing is premature before assessment.", "Restructuring is outside the project's authority."] });
Q({ id: "q100", d: BE, t: 8, ap: "P", type: "mc",
  stem: "The naira loses 25% of its value against the US dollar. The project buys imported equipment priced in dollars. What should the project manager do first?",
  opts: ["Cancel all imported equipment orders", "Assess the impact on costs and the risk register, apply planned risk responses, and inform the sponsor of any effect on the budget", "Ask suppliers to accept naira at the old rate", "Wait to see whether the rate recovers"],
  ans: 1, why: "External changes must be evaluated for their impact, and planned responses applied, with stakeholders informed.",
  notes: ["Cancelling without analysis may cost more.", "", "Suppliers are unlikely to agree, and the contract decides.", "Waiting ignores a material risk."] });
Q({ id: "q101", d: BE, t: 8, ap: "A", type: "mc",
  stem: "A competitor launches a product with a feature your team planned to release in six months. What should the project manager do?",
  opts: ["Ignore the competitor and keep to the roadmap", "Work with the product owner and sponsor to reassess priorities and the product's value in light of the market change", "Ask the team to work overtime to release the feature next month", "Cancel the project"],
  ans: 1, why: "Agile delivery adapts to changes in the external environment. The product owner and sponsor reassess value and priorities.",
  notes: ["Ignoring market change risks delivering low value.", "", "Overtime is unsustainable and the priority may not be right.", "Cancellation is premature."] });
Q({ id: "q102", d: BE, t: 8, ap: "H", type: "mr", pick: 2,
  stem: "A new import tariff on solar panels takes effect during a renewable energy project. Which TWO actions should the project manager take?",
  opts: ["Update the risk register and assess the impact on cost and schedule", "Instruct the procurement team to buy panels through an unofficial channel", "Communicate the impact and options to the sponsor and key stakeholders", "Remove the solar panels from scope without consultation", "Wait until the next phase gate to discuss it"],
  ans: [0, 2], why: "External changes require impact assessment, updated risks and prompt communication with decision-makers.",
  notes: ["", "Avoiding tariffs illegally breaches compliance.", "", "Scope changes require change control.", "Waiting delays decisions."] });

// ---------------- CASE STUDIES ----------------
const CASES = {
  caseA: { title: "Case study: state land records digitisation", text: "You are the project manager of a hybrid project to digitise land records for a state ministry. Scanning and data migration follow a predictive plan; a public search portal is built in two-week sprints. The ministry's Permanent Secretary is the sponsor. Registry officers, who will use the system daily, have attended few sessions so far. A data protection officer joined the ministry last month. The current earned value report shows SPI 0.92 and CPI 1.04 for the migration work." },
  caseB: { title: "Case study: PayCircle savings app", text: "You lead delivery of a group-savings feature for a fintech in Lagos. The team of seven uses Scrum. The product owner is under pressure from investors to launch before a competitor. Two developers have been in conflict over code reviews, and the last retrospective was tense. Customer research shows many users in rural areas use basic phones with limited data." },
};
Q({ id: "q103", d: PE, t: 4, ap: "H", type: "mc", case: "caseA",
  stem: "The registry officers will be the main users of the system, but their engagement is low. What should the project manager do first?",
  opts: ["Ask the Permanent Secretary to require attendance at all sessions", "Meet representative officers to understand their concerns and involve them in sprint reviews and user testing", "Proceed with the plan; training will come at go-live", "Replace the officers on the stakeholder register with their managers"],
  ans: 1, why: "Users with high interest and influence over adoption need active engagement. Understanding their concerns comes before any instruction.",
  notes: ["Mandating attendance doesn't build engagement.", "", "Engaging users only at go-live is too late.", "Managers don't replace the people who will use the system daily."] });
Q({ id: "q104", d: BE, t: 2, ap: "H", type: "mc", case: "caseA",
  stem: "The new data protection officer asks how personal data in the scanned records will be protected. The plan does not cover this in detail. What should the project manager do?",
  opts: ["Explain that the plan was approved before the officer joined", "Work with the officer to identify the data protection requirements, assess the impact and update the plan and backlog through the agreed change process", "Ask the vendor to decide on data protection", "Remove personal data from the records"],
  ans: 1, why: "Compliance requirements must be identified and built in, using the agreed process to update plans and backlog.",
  notes: ["Plans must comply regardless of when the officer joined.", "", "Accountability can't be handed to a vendor.", "The records need the personal data to be useful."] });
Q({ id: "q105", d: PR, t: 9, ap: "H", type: "mc", case: "caseA",
  stem: "The sponsor asks for a summary of the migration work's performance. Based on the earned value report, how should the project manager describe it?",
  opts: ["Ahead of schedule and over budget", "Behind schedule and under budget", "On schedule and on budget", "Behind schedule and over budget"],
  ans: 1, why: "SPI 0.92 (below 1.0) means behind schedule; CPI 1.04 (above 1.0) means under budget for the work performed.",
  notes: ["", "", "", ""] });
Q({ id: "q106", d: PE, t: 2, ap: "A", type: "mc", case: "caseB",
  stem: "The two developers in conflict now avoid reviewing each other's code. What should the project manager do first?",
  opts: ["Assign code reviews to other developers only", "Meet both developers to understand the cause of the conflict and help them agree how reviews will work", "Raise it with HR", "Raise it at the next retrospective in front of the team"],
  ans: 1, why: "Address the conflict directly with the people involved, aiming for a collaborative solution, before escalating or making it public.",
  notes: ["Working around the conflict leaves it unresolved.", "", "Escalation is premature.", "A public discussion may embarrass them and harden positions."] });
Q({ id: "q107", d: PR, t: 3, ap: "A", type: "mc", case: "caseB",
  stem: "Customer research shows many rural users have basic phones. The product owner wants to launch the smartphone app first. How should this finding be handled?",
  opts: ["Ignore it; the app is the priority", "Add USSD access to the backlog and help the product owner weigh it by value against other items", "Tell the team to build USSD access immediately", "Promise rural users USSD at launch"],
  ans: 1, why: "New insight should be captured in the backlog and prioritised by value; the product owner decides the order.",
  notes: ["Ignoring evidence risks missing market value.", "", "Bypasses the product owner and the sprint plan.", "Promises bypass prioritisation."] });
Q({ id: "q108", d: BE, t: 4, ap: "A", type: "mc", case: "caseB",
  stem: "Investors want to launch in three weeks. The team says the payment reconciliation feature will not meet its definition of done in time. What should the project manager do?",
  opts: ["Ask the team to skip testing for the reconciliation feature", "Make the situation visible to the product owner and sponsor with the facts, and help them decide on options such as launching without the feature or adjusting the date", "Extend the sprint until the feature is done", "Launch anyway and fix defects afterwards"],
  ans: 1, why: "Transparency allows the right people to make informed trade-offs. Quality standards should not be dropped quietly.",
  notes: ["Weakening the definition of done risks customers' money.", "", "Sprints are fixed timeboxes.", "Launching a defective payment feature risks customer harm."] });

const BY_ID = Object.fromEntries(BANK.map(q => [q.id, q]));
if (typeof module !== "undefined") module.exports = { BANK, CASES, BY_ID };
