import axios from "axios";

export async function submitRemovalRequests(email: string, name: string): Promise<any[]> {
  // Mock removal requests - in production this would call actual APIs
  const removalSites = [
    { name: "PeopleFinder", url: "https://www.peoplefinder.com", status: "pending" },
    { name: "Spokeo", url: "https://www.spokeo.com", status: "pending" },
    { name: "WhitePages", url: "https://www.whitepages.com", status: "pending" },
    { name: "MyLife", url: "https://www.mylife.com", status: "pending" },
    { name: "Intelius", url: "https://www.intelius.com", status: "pending" },
    { name: "BeenVerified", url: "https://www.beenverified.com", status: "pending" },
    { name: "TruthFinder", url: "https://www.truthfinder.com", status: "pending" },
    { name: "FastPeopleSearch", url: "https://www.fastpeoplesearch.com", status: "pending" },
    { name: "USSearch", url: "https://www.ussearch.com", status: "pending" },
    { name: "PeopleSmart", url: "https://www.peoplesmart.com", status: "pending" }
  ];

  // Simulate processing
  return removalSites.map(site => ({
    ...site,
    requestId: `removal-${Date.now()}-${site.name}`,
    timestamp: new Date().toISOString(),
    status: "completed" // Simulate all completed for demo
  }));
}

export async function getRemovalStatus(requestId: string): Promise<any> {
  // Mock status - in production would query actual API
  return {
    requestId,
    status: "completed",
    sitesRemoved: 10,
    sitesPending: 0,
    timestamp: new Date().toISOString()
  };
}