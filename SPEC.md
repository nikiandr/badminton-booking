# Badminton app Spec

## Design Notes

- Use ShadCN components for everything.
- Use frontend-design skill from Claude Code to help on design.

## Purpose of app

This would be an app that would allow us to manage, create, and edit badminton sessions, and if necessary, notify users about those badminton sessions.

It should have a simple way to log in, for example, Google login for the users and admin.

An admin should be able to create a badminton session, set time for the badminton session, day for the badminton session, how much it cost, where to send money (specific link). In our case, it's LHV bank link.

User should be able to log in, see all the available badminton sessions, register for the badminton session, mark themselves as paid, that they paid for the badminton session.

## Stakeholders

- Admin: Person who manages all badminton sessions creates them and so on.
- User: person who logs in to be able to register for the badminton session.

## Feature set

1. Admin panel which includes the ability of admin to manage existing users. Specifically, I want the admin to be able to approve the users that are allowed to use the platform. There should be a page on the admin panel which lists all users allowed on the platform with different statuses. If this user is not yet approved, it should show that, and there should be an ability to easily approve the user.  

2. Page for admin which shows all the planned and all the previous badminton sessions with the calendar view as well. On the right, there should be a calendar; on the left, there should be the actual view. Also, this page should have a button to create a new badminton session.
This is the page available for both admin and user. The difference is that:

- User wouldn't be able to create new badminton sessions
- User wouldn't be able to edit any badminton sessions
Admin should have this opportunity. They should be able to click the button on one of the sessions and be able to edit info about the sessions or they should be able to delete the session.

3. Creating a badminton session should start with two cards on the left and on the right.

- Cards on the left should say: Start from Existing session.
- When you click on it, the list of all the previous sessions opens, sorted by the date they were created on.
- You can select a session which to base your session on.
The second card should be Create a session from scratch.

4. Next page is the page with info you need to fill out to create a badminton session. If it is created from existing session, there would be some info already filled out. If not, it should be empty. The info which should be in the session includes:

- The date of the session
- The time of the session
- The cost of the session in Euros
- The link for payment for the session (which is also just a text field with a link)
- The time duration of the session.
- The number of places in the session
When clicking create on this page - badminton session should be created.

5. The only login method there should be is Google login. You can access configuration info here for betterAuth: <https://www.better-auth.com/docs/authentication/google>

6. On login or sign up, the user should enter their name and surname.

7. You should create a different login and sign-up page for those purposes.

9. If a user tries to sign in but doesn't have an account yet, redirect them to the sign-up page and show a message that they don't have an account and need to sign up first.

8. Specific badminton session page should look like that.

It should have info about the session on the left and list of people on the right with the queue on the bottom of that list. The number of places in the main part, not in the queue, should be limited to the number of spaces in the badminton session that we added when creating a session. If you're a user, you should be able to register yourself from the specific session. You should always also be able to unregister yourself from the specific session also if you Are in one of the available spaces, so not in the queue. For example, if the badminton session has 4 spaces, and you're one of those 4 people registered, you got your place in time. Then, it should be able to mark yourself as paid. If you're still in the queue, you shouldn't be able to mark yourself as paid.

For the admin, they should be able to remove a person from the queue or the main list. They should be able to edit the info about the session. On this specific page, it would be easy to have some sort of button called "Edit" and be able to edit the contents on the left directly. For example, make this button part of the card, and then allow them to edit the card on the left with the basic info about the session. Admin should also be able to obviously delete this session from the session page.

## Progress

- [ ] 1. Admin panel - user management and approval
- [x] 2. Sessions page with calendar view (admin + user)
- [ ] 3. Create session - start from existing or scratch
- [ ] 4. Session creation form with all fields
- [x] 5. Google login integration
- [x] 6. Name/surname on login or sign up
- [x] 7. Separate login and sign-up pages
- [ ] 8. Session detail page with registration and queue
- [x] 9. Redirect non-existing users from login to signup with message
