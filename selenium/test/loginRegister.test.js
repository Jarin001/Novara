// const { Builder, By, until } = require("selenium-webdriver");
// const assert = require("assert");

// describe("Login and Register Tests", function () {
//   this.timeout(30000);

//   let driver;

//   before(async function () {
//     driver = await new Builder().forBrowser("chrome").build();
//   });

//   // TEST 1 - Login page opens

//   it("should display Login page", async function () {
//     await driver.get("http://localhost:3000/login");

//     const heading = await driver.findElement(By.css(".auth-title"));

//     const headingText = await heading.getText();

//     console.log("Heading:", headingText);

//     assert.strictEqual(headingText, "Welcome Back");

//     await driver.sleep(3000);
//   });

//   // TEST 2 - Enter login credentials

//   it("should allow user to enter email and password", async function () {
//     const email = await driver.findElement(By.name("email"));

//     const password = await driver.findElement(By.name("password"));

//     await email.sendKeys("ayeshaanis@iut-dhaka.edu");
//     await password.sendKeys("Ayesha@871");

//     await driver.sleep(3000);

//     const emailValue = await email.getAttribute("value");

//     assert.strictEqual(emailValue, "ayeshaanis@iut-dhaka.edu");
//   });

//   // TEST 3 - Successful login

//   it("should login successfully with valid credentials", async function () {
//     await driver.get("http://localhost:3000/login");

//     const email = await driver.findElement(By.name("email"));

//     const password = await driver.findElement(By.name("password"));

//     const loginButton = await driver.findElement(By.css(".auth-submit-btn"));

//     await email.sendKeys("ayeshaanis@iut-dhaka.edu");
//     await password.sendKeys("Ayesha@871");

//     await loginButton.click();

//     await driver.sleep(5000);

//     const currentUrl = await driver.getCurrentUrl();

//     assert.ok(currentUrl.includes("/search"));

//     await driver.sleep(3000);
//   });

//   // TEST 4 - Wrong password

//   it("should reject incorrect password", async function () {
//     await driver.get("http://localhost:3000/login");

//     const email = await driver.findElement(By.css('input[name="email"]'));
//     const password = await driver.findElement(By.css('input[name="password"]'));
//     const loginButton = await driver.findElement(By.css(".auth-submit-btn"));

//     await email.sendKeys("ayeshaanis@iut-dhaka.edu");
//     await password.sendKeys("WrongPassword123");
//     await loginButton.click();

//     const errorElement = await driver.wait(
//       until.elementLocated(By.css(".alert-danger")),
//       5000,
//     );

//     const errorText = await errorElement.getText();
//     assert.strictEqual(errorText, "Invalid email or password");

//     // Verify still on login page
//     const currentUrl = await driver.getCurrentUrl();
//     assert.ok(currentUrl.includes("/login"), "Should stay on login page");
//   });

//   // TEST 5 - Empty login fields

//   it("should not allow empty login fields", async function () {
//     await driver.get("http://localhost:3000/login");

//     const loginButton = await driver.findElement(By.css(".auth-submit-btn"));
//     await loginButton.click();

//     // Check validation message
//     const emailInput = await driver.findElement(By.css('input[name="email"]'));
//     const validationMessage =
//       await emailInput.getAttribute("validationMessage");

//     assert.ok(validationMessage, "Email field should show validation error");

//     // Verify still on login page
//     const currentUrl = await driver.getCurrentUrl();
//     assert.ok(currentUrl.includes("/login"), "Should stay on login page");
//   });

//   // TEST 6 - Switch to Register

//   it("should switch from Login to Register", async function () {
//     await driver.get("http://localhost:3000/login");

//     const signUpButton = await driver.wait(
//       until.elementLocated(By.css(".switch-mode-link")),
//       5000,
//     );

//     await signUpButton.click();

//     const heading = await driver.wait(
//       until.elementLocated(By.css(".auth-title")),
//       5000,
//     );

//     const headingText = await heading.getText();


//     assert.strictEqual(headingText, "Create Account");

//     await driver.sleep(3000);
//   });

//   // TEST 7 - Registration fields exist

//   it("should display registration fields", async function () {
//     const name = await driver.findElement(By.name("name"));

//     const email = await driver.findElement(By.name("email"));

//     const affiliation = await driver.findElement(By.name("affiliation"));

//     const password = await driver.findElement(By.name("password"));

//     const confirmPassword = await driver.findElement(
//       By.name("confirmPassword"),
//     );

//     assert.ok(name);
//     assert.ok(email);
//     assert.ok(affiliation);
//     assert.ok(password);
//     assert.ok(confirmPassword);

//     await driver.sleep(3000);
//   });

//   // TEST 8 - Enter registration information

//   it("should allow user to enter registration information", async function () {
//     const name = await driver.findElement(By.name("name"));

//     const email = await driver.findElement(By.name("email"));

//     const affiliation = await driver.findElement(By.name("affiliation"));

//     const password = await driver.findElement(By.name("password"));

//     const confirmPassword = await driver.findElement(
//       By.name("confirmPassword"),
//     );

//     await name.sendKeys("Selenium Student");

//     await email.sendKeys("seleniumtest123@example.com");

//     await affiliation.sendKeys("IUT");

//     await password.sendKeys("Test@1234");

//     await confirmPassword.sendKeys("Test@1234");

//     await driver.sleep(5000);

//     console.log("Registration information entered.");

//     assert.strictEqual(await name.getAttribute("value"), "Selenium Student");
//   });

//   // TEST 9 - Password mismatch

// it("should display error for mismatched passwords", async function () {
//     await driver.get("http://localhost:3000/register");

//     const name = await driver.findElement(By.name("name"));
//     const email = await driver.findElement(By.name("email"));
//     const affiliation = await driver.findElement(By.name("affiliation"));
//     const password = await driver.findElement(By.name("password"));
//     const confirmPassword = await driver.findElement(By.name("confirmPassword"));
//     const registerButton = await driver.findElement(By.css(".auth-submit-btn"));

//     await name.sendKeys("Test Student");
//     await email.sendKeys("teststudent@example.com");
//     await affiliation.sendKeys("IUT");
//     await password.sendKeys("Test@1234");
//     await confirmPassword.sendKeys("Different@1234");

//     await registerButton.click();

//     const error = await driver.wait(
//         until.elementLocated(By.css(".alert.alert-danger")),
//         5000
//     );

//     const errorText = await error.getText();
//     console.log("Error:", errorText);

//     assert.strictEqual(errorText, "Passwords do not match!");
// });

//   // TEST 10 - Invalid email registration

//   it("should reject invalid email during registration", async function () {
//     await driver.get("http://localhost:3000/register");

//     const name = await driver.findElement(By.name("name"));
//     const email = await driver.findElement(By.name("email"));
//     const affiliation = await driver.findElement(By.name("affiliation"));
//     const password = await driver.findElement(By.name("password"));
//     const confirmPassword = await driver.findElement(
//       By.name("confirmPassword"),
//     );

//     const registerButton = await driver.findElement(By.css(".auth-submit-btn"));

//     await name.sendKeys("Test Student");
//     await email.sendKeys("test@nonexistentdomain12345.com");
//     await affiliation.sendKeys("IUT");
//     await password.sendKeys("Test@1234");
//     await confirmPassword.sendKeys("Test@1234");

//     await registerButton.click();

//     const error = await driver.wait(
//       until.elementLocated(By.css(".alert.alert-danger")),
//       5000,
//     );

//     const errorText = await error.getText();

//     console.log("Registration error:", errorText);

//     assert.ok(errorText.length > 0);

//     // Only for watching the result
//     await driver.sleep(3000);
//   });

//   after(async function () {
//     if (driver) {
//       await driver.quit();
//     }
//   });
// });
