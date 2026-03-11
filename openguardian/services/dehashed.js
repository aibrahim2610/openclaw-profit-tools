import axios from "axios";

export async function getBreaches(email: string): Promise<any[]> {
  // For demo, return mock data
  return [
    {
      Name: "Adobe",
      Title: "Adobe",
      Domain: "adobe.com",
      BreachDate: "2013-10-04",
      AddedDate: "2013-12-04",
      ModifiedDate: "2013-12-04T00:00Z",
      PwnCount: 152445165,
      Description: "In October 2013, 153 million Adobe accounts were breached with each containing an internal ID, username, email, <em>encrypted</em> password and a password hint in plain text. The password cryptography was poorly done and many were quickly resolved back to plain text. The data was sourced from the 2013 breach by Brian Krebs.",
      DataClasses: [
        "Email addresses",
        "Password hints",
        "Passwords",
        "Usernames"
      ],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      IsRetired: false,
      IsSpamList: false,
      LogoPath: "https://haveibeenpwned.com/Content/Images/PwnedLogos/Adobe.png"
    },
    {
      Name: "LinkedIn",
      Title: "LinkedIn",
      Domain: "linkedin.com",
      BreachDate: "2012-06-05",
      AddedDate: "2013-06-07",
      ModifiedDate: "2013-06-07T00:00Z",
      PwnCount: 164611595,
      Description: "In June 2012, LinkedIn was hacked and 6.5 million hashed passwords were posted to a Russian forum. The data was later found to be part of a much larger breach affecting over 164 million users. The passwords were stored as SHA1 hashes without salt, the vast majority of which were quickly cracked. The data was first sold on a dark web marketplace in 2021 and then widely circulated.",
      DataClasses: [
        "Email addresses",
        "Passwords",
        "Usernames"
      ],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      IsRetired: false,
      IsSpamList: false,
      LogoPath: "https://haveibeenpwned.com/Content/Images/PwnedLogos/LinkedIn.png"
    }
  ];
}