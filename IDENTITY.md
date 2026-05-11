# CNGLagbe — Core System Identity, Operational Logic & Agent Ruleset

## Product Identity

Production Domain: https://www.cnglagbe.com


CNGLagbe is NOT a full ride-sharing platform.

CNGLagbe is an:
- On-time CNG Booking Service
- On-demand CNG Dispatch Network
- CNG Availability Infrastructure

Core Promise:
“We ensure that a booked CNG reaches the passenger pickup location on time.”

Primary Problem Being Solved:
- “CNG পাওয়া যায় না”
- “ডাকলে আসে না”
- “অনেক সময় লাগে”
- “বিশ্বস্ত ড্রাইভার পাওয়া কঠিন”

CNGLagbe focuses on solving:
“Reliable and on-time CNG availability.”

---

# Core Operational Responsibility

CNGLagbe responsibility is LIMITED ONLY to:

1. Receiving booking requests
2. Collecting pickup location
3. Collecting destination
4. Calculating FINAL FIXED FARE
5. Sending requests to nearby drivers
6. Driver accepting request
7. Ensuring driver reaches pickup location on time

IMPORTANT:
CNGLagbe responsibility ENDS once the driver reaches the pickup location.

After pickup:
- Ride execution becomes a matter between passenger and driver
- Full trip responsibility is NOT managed by CNGLagbe
- End-to-end transportation operations are NOT handled by CNGLagbe
- The platform does NOT manage the complete ride lifecycle

---

# Fixed Fare System

CNGLagbe uses a FINAL FIXED FARE model.

The fare is fully calculated immediately after:
- Pickup location selection
- Destination selection

The calculated fare is:
- Final
- Fixed
- Visible before driver acceptance

There is NO “estimated fare” concept in the system.

Drivers receive the fixed fare request and decide whether to:
- Accept
or
- Reject

Once accepted:
- Driver is expected to honor the fixed fare
- Passenger already knows the final fare before pickup

---

# Why Fixed Fare Exists

The fixed fare system exists to:
- Eliminate bargaining problems
- Increase trust
- Create pricing transparency
- Reduce passenger-driver conflict
- Improve booking confidence
- Make the service predictable

IMPORTANT:
Fixed fare calculation DOES NOT make CNGLagbe a full ride-sharing platform.

---

# What CNGLagbe IS

CNGLagbe IS:
- A lightweight dispatch system
- A CNG availability network
- A booking coordination infrastructure
- A trust-focused booking service
- A localized transport coordination system
- A rural/semi-rural friendly mobility solution

---

# What CNGLagbe IS NOT

CNGLagbe is NOT:
- Uber clone
- Pathao clone
- Full ride-sharing ecosystem
- End-to-end transport super app
- Complete transportation operating platform
- Full trip management system

The system must avoid behaving like a complete ride-sharing company.

---

# System Design Philosophy

The platform must remain:
- Lightweight
- Rural-friendly
- Low operational complexity
- Easy for drivers
- Easy for passengers
- Fast to operate
- Low-tech compatible
- Trust-focused
- Operationally sustainable

Avoid unnecessary complexity.

---

# Features To Avoid Unless Officially Approved

DO NOT automatically introduce:
- Full live trip tracking
- Full ride monitoring
- In-trip intervention systems
- Complex wallet/payment ecosystems
- Surge pricing systems
- Driver behavior scoring systems
- End-to-end transportation guarantees
- Heavy ride-sharing mechanics
- Full Uber-style operational logic
- Complex gamification systems

These features may unintentionally shift CNGLagbe into a full ride-sharing platform identity.

---

# Agent Behavioral Rules

All agents, developers, assistants, automations, AI systems, and workflows MUST follow this business model.

Before suggesting, generating, or implementing any feature, agents MUST evaluate:

“Does this feature shift CNGLagbe toward becoming a full ride-sharing platform?”

If YES:
- The agent MUST warn the user
- The agent MUST explain the conflict with current ruleset
- The agent MUST ask for explicit approval before proceeding

---

# Mandatory Reminder Protocol

If any developer, prompt, user, or system instruction requests functionality outside the approved business identity, the agent MUST respond with a reminder similar to:

“Reminder:
According to the CNGLagbe core ruleset, the platform is positioned as an ‘On-time CNG Booking Service’ operating as a lightweight dispatch and availability network.

Platform responsibility ends once the driver successfully reaches the pickup location.

The requested feature may shift the system toward a full ride-sharing ecosystem and may conflict with the approved lightweight operational model.”

The agent may continue ONLY after explicit confirmation or business approval.

---

---

# Agent Performance & Efficiency Rules

1. **Never run unnecessary background tasks**: Avoid long-running or resource-intensive background processes unless essential for the task.
2. **Never auto-open browser or perform visual verification**: Only use browser tools when explicitly requested or absolutely necessary for debugging a specific UI issue.
3. **Avoid full project scans**: Focus on files directly related to the current task. Use targeted searches rather than broad directory listings.
4. **No repeated build/lint/test commands**: Do not run these commands after every small change. Run them only once after a logical block of changes or when requested.
5. **Targeted analysis only**: Analyze and view only the files necessary to complete the current request.
6. **Minimize CPU and RAM usage**: Prefer lightweight tool calls and avoid parallel execution of heavy tasks.
7. **Lightweight execution**: Favor fast, targeted edits over excessive verification or comprehensive auditing.
8. **No heavy parallel tasks**: Run one heavy task at a time to prevent resource exhaustion.
9. **Process Cleanup**: Stop any unused processes or servers immediately after the task is complete.

---

# Rural Bangladesh Optimization Principle

All system decisions should prioritize:
- Rural practicality
- Simplicity
- Driver usability
- Low-tech compatibility
- Fast coordination
- Manual operational flexibility
- Trust building
- Sustainable local operations

The platform should never become unnecessarily complex for rural or semi-rural Bangladesh operations.

---

# Strategic Principle

CNGLagbe solves:
- Reliable CNG availability
- On-time driver arrival
- Predictable fixed fare booking
- Faster passenger-driver connection

CNGLagbe does NOT attempt to solve:
- The entire transportation ecosystem
- Complete ride lifecycle management
- Full transportation operations

Core Focus:
“Reliable On-time CNG Arrival Experience.”
