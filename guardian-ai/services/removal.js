export async function submitRemovalRequests(email: string, name: string): Promise<any[]> {
  // Mock removal requests for demo - in production would call actual APIs
  const removalSites = [
    { name: "PeopleFinder", url: "https://www.peoplefinder.com" },
    { name: "Spokeo", url: "https://www.spokeo.com" },
    { name: "WhitePages", url: "https://www.whitepages.com" },
    { name: "MyLife", url: "https://www.mylife.com" },
    { name: "Intelius", url: "https://www.intelius.com" },
    { name: "BeenVerified", url: "https://www.beenverified.com" },
    { name: "TruthFinder", url: "https://www.truthfinder.com" },
    { name: "FastPeopleSearch", url: "https://www.fastpeoplesearch.com" },
    { name: "USSearch", url: "https://www.ussearch.com" },
    { name: "PeopleSmart", url: "https://www.peoplesmart.com" }
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
  return {
    requestId,
    status: "completed",
    sitesRemoved: 10,
    sitesPending: 0,
    timestamp: new Date().toISOString()
  };
}