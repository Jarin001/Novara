// const { Builder, By, until } = require('selenium-webdriver');
// const assert = require("assert");

// describe("PaperDetails Page Test", function() {

//     this.timeout(30000); // Set timeout to 30 seconds

//     let driver;

//     const paperId = "19b82931446f39d6914add5102342f0b3a627052";

//     before(async function() {
//         driver = await new Builder().forBrowser("firefox").build();
//     });

//     it("should display the paper title", async function() {
//         await driver.get(`http://localhost:3000/paper/${paperId}`);

//         // Wait for the title <h1> to appear once the paper data loads
//         const titleElement = await driver.wait(
//             until.elementLocated(By.css("h1")),
//             10000
//         );

//         const titleText = await titleElement.getText();
//         console.log("Paper Title:", titleText);

//         assert.ok(titleText.length > 0, "Expected the paper title to be non-empty");
//     });

//     it("should show a login alert when clicking Save while not logged in", async function() {
//         const saveButton = await driver.wait(
//             until.elementLocated(By.xpath("//button[contains(., 'Save to Library')]")),
//             10000
//         );
//         await saveButton.click();

//         const alert = await driver.wait(until.alertIsPresent(), 5000);
//         const alertText = await alert.getText();
//         console.log("Alert text:", alertText);

//         assert.strictEqual(alertText, "Please log in to save papers to libraries");
//         await alert.accept();

//         await driver.wait(until.urlContains('/login'), 5000);
//     });

//     it("should open the Cite modal when Cite button is clicked", async function() {
//         await driver.get(`http://localhost:3000/paper/${paperId}`);

//         const citeButton = await driver.wait(
//             until.elementLocated(By.xpath("//button[contains(., 'Cite')]")),
//             10000
//         );
//         await citeButton.click();

//         const citeModal = await driver.wait(
//             until.elementLocated(By.css(".cite-modal")),
//             5000
//         );

//         const modalHeading = await citeModal.findElement(By.css("h2"));
//         const headingText = await modalHeading.getText();
//         console.log("Cite modal heading:", headingText);

//         assert.strictEqual(headingText, "Cite Paper");

//         // Close the modal so its overlay doesn't block later tests
//         const closeButton = await citeModal.findElement(By.xpath(".//button[contains(., '✕')]"));
//         await closeButton.click();
//         await driver.wait(until.stalenessOf(citeModal), 5000);
//     });

//     it("should expand the abstract when Expand is clicked", async function() {
//         const expandButton = await driver.wait(
//             until.elementLocated(By.xpath("//button[contains(., 'Expand')]")),
//             10000
//         );
//         await expandButton.click();

//         const collapseButton = await driver.wait(
//             until.elementLocated(By.xpath("//button[contains(., 'Collapse')]")),
//             5000
//         );
//         const buttonText = await collapseButton.getText();
//         console.log("Abstract toggle button now shows:", buttonText);

//         assert.strictEqual(buttonText, "Collapse");
//     });

//     it("should navigate to the Related Papers page when that tab is clicked", async function() {
//         const relatedTab = await driver.wait(
//             until.elementLocated(By.xpath("//button[contains(., 'Related Papers')]")),
//             10000
//         );
//         await relatedTab.click();

//         await driver.wait(until.urlContains('/related/'), 5000);
//         const currentUrl = await driver.getCurrentUrl();
//         console.log("Navigated to:", currentUrl);

//         assert.ok(currentUrl.includes('/related/'));
//     });

//     after(async function() {
//         if (driver) {
//             await driver.quit();
//         }
//     });

// });