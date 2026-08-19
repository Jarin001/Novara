const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000";

const TEST_EMAIL = "afreensanjana74@gmail.com";
const TEST_PASSWORD = "Sa42106!";

const ELEMENT_TIMEOUT = 20000;


const TEST_PAPER_ID = "1706.03762";


describe("Upload Paper Test", function () {

    this.timeout(120000);

    let driver;

    // LOGIN

    before(async function () {

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        await driver.get(`${BASE_URL}/login`);

        const email = await driver.wait(
            until.elementLocated(
                By.css('input[name="email"]')
            ),
            ELEMENT_TIMEOUT
        );

        const password = await driver.wait(
            until.elementLocated(
                By.css('input[name="password"]')
            ),
            ELEMENT_TIMEOUT
        );

        const loginBtn = await driver.wait(
            until.elementLocated(
                By.css('button[type="submit"]')
            ),
            ELEMENT_TIMEOUT
        );

        await email.sendKeys(TEST_EMAIL);
        await password.sendKeys(TEST_PASSWORD);

        await loginBtn.click();

        await driver.wait(
            until.urlContains("/search"),
            ELEMENT_TIMEOUT
        );

        console.log("Login successful.");
    });


    // Open Upload Paper modal
    async function openUploadModal() {

        await driver.get(`${BASE_URL}/profile`);

        await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        const uploadBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Upload Paper')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await driver.wait(
            until.elementIsVisible(uploadBtn),
            ELEMENT_TIMEOUT
        );

        await uploadBtn.click();

        await driver.wait(
            until.elementLocated(
                By.css(".upload-modal-title")
            ),
            ELEMENT_TIMEOUT
        );
    }

    // TEST 1
    // Open Upload Paper modal

    it("should open the Upload Paper modal", async function () {

        await openUploadModal();

        const title = await driver.findElement(
            By.css(".upload-modal-title")
        );

        assert.strictEqual(
            (await title.getText()).trim(),
            "Upload Paper"
        );

        console.log("Upload Paper modal opened.");
    });


    // TEST 2
    // Input field should be visible
    it("should display the paper ID input field", async function () {

        await openUploadModal();

        const input = await driver.wait(
            until.elementLocated(
                By.css(".upload-input")
            ),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await input.isDisplayed(),
            "Paper ID input should be visible"
        );

        // Check the actual placeholder from UploadPaperModal.jsx
        const placeholder =
            await input.getAttribute("placeholder");

        assert.strictEqual(
            placeholder,
            "e.g., 123456789 or 10.1038/nature12345 or 2401.12345"
        );

        // Also verify the label
        const label = await driver.findElement(
            By.css(".upload-label")
        );

        assert.strictEqual(
            (await label.getText()).trim(),
            "Enter Corpus ID, DOI, or ArXiv ID"
        );

        console.log("Paper ID input is displayed.");
    });


    // TEST 3
    // Empty input validation
    it("should show an error when no paper ID is entered", async function () {

        await openUploadModal();

        const fetchBtn = await driver.wait(
            until.elementLocated(
                By.css(".upload-fetch-btn")
            ),
            ELEMENT_TIMEOUT
        );

        await fetchBtn.click();

        const error = await driver.wait(
            until.elementLocated(
                By.css(".upload-error")
            ),
            ELEMENT_TIMEOUT
        );

        const errorText = (
            await error.getText()
        ).trim();

        assert.strictEqual(
            errorText,
            "Please enter a Corpus ID, DOI, or ArXiv ID"
        );

        console.log("Empty input validation works.");
    });

    // TEST 4
    // Fetch paper details
    it("should fetch and display paper details", async function () {

        await openUploadModal();

        const input = await driver.wait(
            until.elementLocated(
                By.css(".upload-input")
            ),
            ELEMENT_TIMEOUT
        );

        await input.sendKeys(TEST_PAPER_ID);

        const fetchBtn = await driver.findElement(
            By.css(".upload-fetch-btn")
        );

        await fetchBtn.click();

        console.log("Fetching paper details...");

        // Wait for preview to appear
        const preview = await driver.wait(
            until.elementLocated(
                By.css(".paper-preview-section")
            ),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await preview.isDisplayed(),
            "Paper preview should be visible"
        );

        const title = await driver.wait(
            until.elementLocated(
                By.css(".paper-preview-title")
            ),
            ELEMENT_TIMEOUT
        );

        const titleText = (
            await title.getText()
        ).trim();

        assert.ok(
            titleText.length > 0,
            "Paper title should not be empty"
        );

        console.log(
            "Paper title:",
            titleText
        );
    });

    // TEST 5
    // Confirm button appears after successful fetch

    it("should display the Confirm & Add to Publications button after fetching paper details",
        async function () {

            await openUploadModal();

            const input = await driver.wait(
                until.elementLocated(
                    By.css(".upload-input")
                ),
                ELEMENT_TIMEOUT
            );

            await input.sendKeys(TEST_PAPER_ID);

            await driver.findElement(
                By.css(".upload-fetch-btn")
            ).click();

            // Wait for paper details
            await driver.wait(
                until.elementLocated(
                    By.css(".paper-preview-section")
                ),
                ELEMENT_TIMEOUT
            );

            const confirmBtn = await driver.wait(
                until.elementLocated(
                    By.css(".upload-btn-confirm")
                ),
                ELEMENT_TIMEOUT
            );

            assert.ok(
                await confirmBtn.isDisplayed(),
                "Confirm button should be visible"
            );

            const buttonText = (
                await confirmBtn.getText()
            ).trim();

            assert.ok(
                buttonText.includes(
                    "Confirm & Add to Publications"
                ),
                "Confirm button should have correct text"
            );

            console.log(
                "Confirm button displayed."
            );
        }
    );

    // TEST 6
    // Close modal using X button
    it("should close the modal when the close button is clicked",
        async function () {

            await openUploadModal();

            const modalTitle = await driver.wait(
                until.elementLocated(
                    By.css(".upload-modal-title")
                ),
                ELEMENT_TIMEOUT
            );

            const closeBtn = await driver.wait(
                until.elementLocated(
                    By.css(".upload-modal-close-btn")
                ),
                ELEMENT_TIMEOUT
            );

            await closeBtn.click();

            // Modal title should disappear
            await driver.wait(
                until.stalenessOf(modalTitle),
                ELEMENT_TIMEOUT
            );

            console.log(
                "Upload Paper modal closed successfully."
            );
        }
    );


    after(async function () {

        if (driver) {
            await driver.quit();
        }
    });

});