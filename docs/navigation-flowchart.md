# AusAutoPartsDemo Navigation Flowchart

This Mermaid diagram represents the navigation structure of the AusAutoPartsDemo application. 
Pages are grouped by access level: 
- **Public** (unauthenticated, round nodes `(( ))`)
- **Customer** (customer role, rectangle nodes `[ ]`)
- **Management** (management role, rectangle nodes `[ ]`)

Directed edges show typical navigation links, with labels for key actions/transitions. 
Dynamic routes (e.g., `/:id`) are included as discovered pages.

```mermaid
graph TD
    subgraph Public ["🛡️ Public Pages"]
        Login((/login))
        Register((/register))
        Page404((/404))
    end
    
    subgraph Customer ["👤 Customer Pages"]
        Home[/ /]
        CDashboard[Dashboard]
        Marketplace[Marketplace]
        MCategory["Marketplace /:categoryId"]
        PartDetail["Part Detail /marketplace/:id"]
        Messages[Messages]
        MConv["Messages /:conv"]
        Favorites[Favorites]
        Search[Search]
        Profile[Profile]
    end
    
    subgraph Management ["🏢 Management Pages"]
        MDashboard["Management /dashboard"]
        Parts[Parts]
        MCust[Customers]
        CustDetail["Customers /:id"]
        Orders[Orders]
        Vehicles[Vehicles]
        Quotes[Quotes]
        Analytics[Analytics]
        Reports[Reports]
        RptSales["Reports /sales"]
        RptInv["Reports /inventory"]
    end

    Login -->|"Customer Login"| CDashboard
    Login -.->|"Management Login"| MDashboard
    Register -->|"Customer Register"| CDashboard
    Register -.->|"Management Register"| MDashboard
    Page404 -.->|"Redirect"| Home

    %% Customer nav from dashboard
    CDashboard --> Home
    CDashboard --> Marketplace
    CDashboard --> Messages
    CDashboard --> Favorites
    CDashboard --> Search
    CDashboard --> Profile
    
    %% Customer subnav
    Marketplace --> MCategory
    MCategory --> PartDetail
    Messages --> MConv

    %% Management nav from dashboard
    MDashboard --> Parts
    MDashboard --> MCust
    MDashboard --> Orders
    MDashboard --> Vehicles
    MDashboard --> Quotes
    MDashboard --> Analytics
    MDashboard --> Reports
    
    %% Management subnav
    MCust --> CustDetail
    Reports --> RptSales
    Reports --> RptInv