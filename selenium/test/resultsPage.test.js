const { Builder, By, until, Select } = require('selenium-webdriver');
const assert = require("assert");

describe("ResultsPage Test", function() {

    this.timeout(45000); // Set timeout to 45 seconds (live search API can be slow)

    let driver;

    const searchQuery = "machine learning";

    before(async function() {
        driver = await new Builder().forBrowser("firefox").build();
    });

    it("should display search results for a query", async function() {
        await driver.get(`http://localhost:3000/search?q=${encodeURIComponent(searchQuery)}`);

        // Wait for the results heading to update from "Loading results..."
        const heading = await driver.wait(
            until.elementLocated(By.css("h3")),
            15000
        );

        await driver.wait(async () => {
            const text = await heading.getText();
            return text.toLowerCase().includes("results for");
        }, 25000);

        const headingText = await heading.getText();
        console.log("Results heading:", headingText);

        assert.ok(/About [\d,]+ results for/.test(headingText), "Expected results count in heading");
    });

    it("should show a login alert when clicking Save on a result while not logged in", async function() {
        const saveButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Save')]")),
            10000
        );
        await saveButton.click();

        const alert = await driver.wait(until.alertIsPresent(), 5000);
        const alertText = await alert.getText();
        console.log("Alert text:", alertText);

        assert.strictEqual(alertText, "Please log in to save papers to libraries");
        await alert.accept();
    });

    it("should open the Cite modal when Cite button is clicked on a result", async function() {
        // The previous test's Save click redirected the browser to /login, so
        // navigate back to the results page first.
        await driver.get(`http://localhost:3000/search?q=${encodeURIComponent(searchQuery)}`);

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

    it("should navigate to the paper page when a result title is clicked", async function() {
        await driver.get(`http://localhost:3000/search?q=${encodeURIComponent(searchQuery)}`);

        const resultTitle = await driver.wait(
            until.elementLocated(By.css('button[style*="text-align: left"]')),
            25000
        );
        const titleText = await resultTitle.getText();
        console.log("Clicking result:", titleText);

        await resultTitle.click();

        await driver.wait(until.urlContains('/paper/'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        console.log("Navigated to:", currentUrl);

        assert.ok(currentUrl.includes('/paper/'));
    });

    it("should toggle the Fields of Study filter panel open", async function() {
        await driver.get(`http://localhost:3000/search?q=${encodeURIComponent(searchQuery)}`);

        const fieldsButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Fields of Study')]")),
            25000
        );
        await fieldsButton.click();

        const panelLabel = await driver.wait(
            until.elementLocated(By.xpath("//strong[contains(., 'Fields of Study')]")),
            5000
        );
        const labelText = await panelLabel.getText();
        console.log("Filter panel label:", labelText);

        assert.strictEqual(labelText, "Fields of Study");
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

    it("should reload results when changing the Sort by dropdown", async function() {
        const sortDropdown = await driver.wait(
            until.elementLocated(By.css("select")),
            10000
        );

        const select = new Select(sortDropdown);
        await select.selectByVisibleText("Citation count");

        const heading = await driver.findElement(By.css("h3"));
        await driver.wait(async () => {
            const text = await heading.getText();
            return text.toLowerCase().includes("results for");
        }, 25000);

        const headingText = await heading.getText();
        console.log("Heading after sort change:", headingText);

        assert.ok(/About [\d,]+ results for/.test(headingText));
    });

    it("should update the URL when searching via the search box", async function() {
        const searchInput = await driver.wait(
            until.elementLocated(By.css('input[placeholder="Search for articles..."]')),
            10000
        );
        await searchInput.clear();
        await searchInput.sendKeys("deep learning");

        const searchButton = await driver.wait(
            until.elementLocated(By.xpath("//button[text()='Search']")),
            5000
        );
        await searchButton.click();

        await driver.wait(until.urlContains('q=deep'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        console.log("New search URL:", currentUrl);

        assert.ok(currentUrl.includes('q=deep'));
    });

    it("should show 'No results found' for a nonsense query", async function() {
        await driver.get(`http://localhost:3000/search?q=zzzxxxqqqnonsenseterm12345`);

        const heading = await driver.wait(until.elementLocated(By.css("h3")), 15000);
        await driver.wait(async () => {
            const text = await heading.getText();
            return text.toLowerCase().includes("no results found");
        }, 25000);

        const headingText = await heading.getText();
        console.log("No-results heading:", headingText);

        assert.ok(headingText.includes('No results found for "zzzxxxqqqnonsenseterm12345"'));
    });

    after(async function() {
        if (driver) {
            await driver.quit();
        }
    });

});
