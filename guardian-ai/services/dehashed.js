export async function getBreaches(email: string): Promise<any[]> {
  // Demo mode - return breach data
  return [
    {
      Name: "Adobe",
      Title: "Adobe",
      Domain: "adobe.com",
      BreachDate: "2013-10-04",
      PwnCount: 152445165,
      Description: "In October 2013, 153 million Adobe accounts were breached",
      DataClasses: ["Email addresses", "Password hints", "Passwords", "Usernames"],
      IsVerified: true,
      email
    },
    {
      Name: "LinkedIn",
      Title: "LinkedIn",
      Domain: "linkedin.com",
      BreachDate: "2012-06-05",
      PwnCount: 164611595,
      Description: "In June 2012, LinkedIn was hacked and 6.5 million hashed passwords were posted",
      DataClasses: ["Email addresses", "Passwords", "Usernames"],
      IsVerified: true,
      email
    }
  ];
}