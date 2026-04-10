import { AppProvider, Page, Card, BlockStack, Text, Button, Banner } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

export function LoginPage() {
  const params = new URLSearchParams(window.location.search);
  const authFailed = params.get("error") === "auth_failed";

  return (
    <AppProvider i18n={enTranslations}>
      <Page title="Google Ads Anomaly Detector">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <div style={{ width: "100%", maxWidth: "480px" }}>
            <Card>
              <BlockStack gap="400">
                {authFailed && (
                  <Banner tone="critical">
                    Authorization failed. Please try again.
                  </Banner>
                )}
                <Text as="h2" variant="headingLg">
                  Connect your Google Ads account
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Sign in with Google to analyze your campaigns for anomalies.
                </Text>
                <Button variant="primary" url="http://localhost:4000/auth/google">
                  Connect Google Ads
                </Button>
              </BlockStack>
            </Card>
          </div>
        </div>
      </Page>
    </AppProvider>
  );
}
