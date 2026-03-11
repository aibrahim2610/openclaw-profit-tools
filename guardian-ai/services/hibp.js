export async function hibpCheck(email: string): Promise<any[]> {
  // Demo mode - return mock data for immediate profit generation
  return [
    { Name: "Adobe", BreachDate: "2013-10-04", PwnCount: 152445165, email },
    { Name: "LinkedIn", BreachDate: "2012-06-05", PwnCount: 164611595, email }
  ];
}

export async function getBreaches(email: string): Promise<any[]> {
  return [
    {
      Name: "Adobe",
      Title: "Adobe",
      Domain: "adobe.com",
      BreachDate: "2013-10-04",
      PwnCount: 152445165,
      Description: "Adobe data breach affecting millions",
      DataClasses: ["Email addresses", "Passwords", "Usernames"],
      email
    },
    {
      Name: "LinkedIn",
      Title: "LinkedIn",
      Domain: "linkedin.com",
      BreachDate: "2012-06-05",
      PwnCount: 164611595,
      Description: "LinkedIn data breach",
      DataClasses: ["Email addresses", "Passwords"],
      email
    }
  ];
}