import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

export const CSVFormatGuide = () => {
  const requiredFields = [
    {
      field: "first_name",
      description: "First name of the lead",
      example: "John",
    },
    {
      field: "last_name",
      description: "Last name of the lead",
      example: "Doe",
    },
    {
      field: "company",
      description: "Company name",
      example: "Acme Inc.",
    },
    {
      field: "job_title",
      description: "Job title or position",
      example: "Sales Manager",
    },
    {
      field: "location",
      description: "Location or country",
      example: "United States",
    },
    {
      field: "linkedin_url",
      description: "LinkedIn profile URL or website",
      example: "https://linkedin.com/in/johndoe",
    },
  ];

  const optionalFields = [
    {
      field: "email",
      description: "Email address",
      example: "john.doe@example.com",
    },
    {
      field: "phone",
      description: "Phone number",
      example: "+1234567890",
    },
    {
      field: "industry",
      description: "Industry or sector",
      example: "Technology",
    },
    {
      field: "source",
      description: "Lead source",
      example: "LinkedIn",
    },
    {
      field: "notes",
      description: "Additional notes",
      example: "Met at conference",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Format Guide</CardTitle>
        <CardDescription>
          Follow this guide to ensure your CSV file is properly formatted for import
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle>Important Notes:</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Use comma (,) as the delimiter</li>
              <li>Include headers in the first row</li>
              <li>All required fields must be present</li>
              <li>Save the file in UTF-8 encoding</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="text-lg font-semibold mb-3">Required Fields</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requiredFields.map((field) => (
                <TableRow key={field.field}>
                  <TableCell className="font-medium">{field.field}</TableCell>
                  <TableCell>{field.description}</TableCell>
                  <TableCell>{field.example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Optional Fields</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optionalFields.map((field) => (
                <TableRow key={field.field}>
                  <TableCell className="font-medium">{field.field}</TableCell>
                  <TableCell>{field.description}</TableCell>
                  <TableCell>{field.example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Alert>
          <AlertTitle>Example CSV Format:</AlertTitle>
          <AlertDescription className="font-mono text-sm mt-2">
            first_name,last_name,company,job_title,location,linkedin_url,email,phone<br />
            John,Doe,Acme Inc,Sales Manager,United States,https://linkedin.com/in/johndoe,john@acme.com,+1234567890
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CSVFormatGuide;
