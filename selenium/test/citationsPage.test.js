const { Builder, By, until, Select } = require('selenium-webdriver');
const assert = require("assert");

describe("CitationsPage Test", function() {

    this.timeout(45000); // Set timeout to 45 seconds (live search API can be slow)

    let driver;

    const paperId = "19b82931446f39d6914add5102342f0b3a627052";

    before(async function() {
        driver = await new Builder().forBrowser("firefox").build();
    });

    it("should display citations for a paper", async function() {
        await driver.get(`http://localhost:3000/citations/${paperId}`);

        const pageHeading = await driver.wait(
            until.elementLocated(By.xpath("//h2[contains(., 'Papers Citing This Work')]")),
            25000
        );
        const pageHeadingText = await pageHeading.getText();
        console.log("Page heading:", pageHeadingText);

        const resultsHeading = await driver.findElement(By.xpath("//h3[contains(., 'About')]"));
        const resultsHeadingText = await resultsHeading.getText();
        console.log("Results heading:", resultsHeadingText);

        assert.ok(/About [\d,]+ results/.test(resultsHeadingText));
    });

    it("should navigate to the paper page when a citation title is clicked", async function() {
        const citationTitle = await driver.wait(
            until.elementLocated(By.css('button[style*="text-align: left"]')),
            10000
        );
        const titleText = await citationTitle.getText();
        console.log("Clicking citation:", titleText);

        await citationTitle.click();

        await driver.wait(until.urlContains('/paper/'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        console.log("Navigated to:", currentUrl);

        assert.ok(currentUrl.includes('/paper/'));
    });

    it("should show a login alert when clicking Save on a citation while not logged in", async function() {
        await driver.get(`http://localhost:3000/citations/${paperId}`);

        const saveButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Save')]")),
            25000
        );
        await saveButton.click();

        const alert = await driver.wait(until.alertIsPresent(), 5000);
        const alertText = await alert.getText();
        console.log("Alert text:", alertText);

        assert.strictEqual(alertText, "Please log in to save papers to libraries");
        await alert.accept();
    });

    it("should open the Cite modal when Cite button is clicked on a citation", async function() {
        // The previous test's Save click redirected the browser to /login, so
        // navigate back to the citations page first.
        await driver.get(`http://localhost:3000/citations/${paperId}`);

        const citeButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Cite')]")),
            25000
        );
        await citeButton.click();

        const citeModal = await driver.wait(
            until.elementLocated(By.css(".cite-modal")),
            5000
        );

        const modalHeading = await citeModal.findElement(By.css("h2"));
        const headingText = await modalHeading.getText();
        console.log("Cite modal heading:", headingText);

        assert.strictEqual(headingText, "Cite Paper");

        // Close the modal so its overlay doesn't block later tests
        const closeButton = await citeModal.findElement(By.xpath(".//button[contains(., '✕')]"));
        await closeButton.click();
        await driver.wait(until.stalenessOf(citeModal), 5000);
    });

    it("should toggle the Date Range filter panel open", async function() {
        const dateButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Date Range')]")),
            10000
        );
        await dateButton.click();

        const thisYearButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'This year')]")),
            5000
        );
        const buttonText = await thisYearButton.getText();
        console.log("Date range shortcut button:", buttonText);

        assert.strictEqual(buttonText, "This year");
    });

    it("should keep showing results after changing the Sort by dropdown", async function() {
        const sortDropdown = await driver.wait(
            until.elementLocated(By.css("select")),
            10000
        );

        const select = new Select(sortDropdown);
        await select.selectByVisibleText("Citation count");

        // Sorting here is client-side (no refetch), so it should update instantly
        const resultsHeading = await driver.findElement(By.xpath("//h3[contains(., 'About')]"));
        const headingText = await resultsHeading.getText();
        console.log("Heading after sort change:", headingText);

        assert.ok(/About [\d,]+ results/.test(headingText));
    });

    after(async function() {
        if (driver) {
            await driver.quit();
        }
    });

});
