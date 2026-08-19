const { Builder, By, until } = require("selenium-webdriver");
const assert = require("assert");

const BASE_URL = "http://localhost:3000";

const TEST_EMAIL = "afreensanjana74@gmail.com";
const TEST_PASSWORD = "Sa42106!";

const OWN_PROFILE_USER_ID = "05ba30b0-e143-42c8-8750-096e9fae55ce";
const OTHER_PROFILE_USER_ID = "069c7331-8ffe-41fd-b1b2-a281a2527cf8";

const ELEMENT_TIMEOUT = 20000;


describe("User Profile Test", function () {

    // Mocha's overall timeout
    this.timeout(120000);

    let driver;


    before(async function () {

        driver = await new Builder()
            .forBrowser("chrome")
            .build();

        // Open login page
        await driver.get(`${BASE_URL}/login`);

        // Find login fields
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

        // Enter credentials
        await email.sendKeys(TEST_EMAIL);
        await password.sendKeys(TEST_PASSWORD);

        // Click login
        await loginBtn.click();

        // Wait until login redirects to search page
        await driver.wait(
            until.urlContains("/search"),
            20000
        );

        console.log("Login successful.");
        console.log("Current URL:", await driver.getCurrentUrl());
    });


    // TEST 1
    // Load own profile and verify name

    it("should load the logged-in user's own profile and show their name", async function () {

        await driver.get(`${BASE_URL}/profile`);

        // Wait until the actual profile is rendered.
        // UserProfile.jsx initially renders "Loading profile..."
        // and only renders .profile-name after loading finishes.
        const nameEl = await driver.wait(
            until.elementLocated(
                By.css(".profile-name")
            ),
            ELEMENT_TIMEOUT
        );

        await driver.wait(
            until.elementIsVisible(nameEl),
            ELEMENT_TIMEOUT
        );

        const nameText = await nameEl.getText();

        console.log("Profile name:", nameText);

        assert.ok(
            nameText.trim().length > 0,
            "Profile name should not be empty"
        );
    });


    // TEST 2
    // Edit Profile button + modal

    it("should show the Edit Profile button on own profile and open the edit modal", async function () {

        await driver.get(`${BASE_URL}/profile`);

        // Wait for profile page to finish loading
        const editBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[.//span[contains(normalize-space(), 'Edit Profile')]]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await driver.wait(
            until.elementIsVisible(editBtn),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await editBtn.isDisplayed(),
            "Edit Profile button should be visible"
        );


        await editBtn.click();

        const modalContent = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//*[contains(normalize-space(), 'Edit Profile')]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await modalContent.isDisplayed(),
            "Edit Profile modal should be visible"
        );
    });


    // TEST 3
    // Upload Paper modal

    it("should open the Upload Paper modal", async function () {

        await driver.get(`${BASE_URL}/profile`);

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

        assert.ok(
            await uploadBtn.isDisplayed(),
            "Upload Paper button should be visible"
        );

        await uploadBtn.click();

        const modalText = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//*[contains(normalize-space(), 'Upload Paper')]"
                )
            ),
            ELEMENT_TIMEOUT
        );

        assert.ok(
            await modalText.isDisplayed(),
            "Upload Paper modal should be visible"
        );
    });



    // TEST 4
    // Follow another user

    it("should follow another user from their profile page", async function () {

        await driver.get(
            `${BASE_URL}/user/${OTHER_PROFILE_USER_ID}`
        );

        // Wait for the Follow button.
        const followBtn = await driver.wait(
            until.elementLocated(
                By.xpath(
                    "//button[normalize-space()='Follow' or normalize-space()='Follow Back' or normalize-space()='Following']"
                )
            ),
            ELEMENT_TIMEOUT
        );

        await driver.wait(
            until.elementIsVisible(followBtn),
            ELEMENT_TIMEOUT
        );

        const initialText = (
            await followBtn.getText()
        ).trim();

        console.log(
            "Initial follow button:",
            initialText
        );

        // If already following, don't click again.
        if (
            initialText.toLowerCase() === "following"
        ) {

            console.log(
                "Already following this user."
            );

        } else {

            await followBtn.click();

            // Wait until state changes to Following
            await driver.wait(
                async function () {

                    const currentText = (
                        await followBtn.getText()
                    ).trim().toLowerCase();

                    return currentText.includes("following");
                },
                ELEMENT_TIMEOUT
            );
        }

        const updatedText = (
            await followBtn.getText()
        ).trim();

        console.log(
            "Updated follow button:",
            updatedText
        );

        assert.ok(
            updatedText.toLowerCase().includes("following"),
            "Button should show Following after following the user"
        );
    });


    after(async function () {

        if (driver) {
            await driver.quit();
        }
    });

});