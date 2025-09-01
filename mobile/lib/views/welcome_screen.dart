import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/AppStyles.dart';
import 'package:ticket_tap/themes/gradient_background.dart';
import 'package:ticket_tap/views/sign_in.dart';
import 'package:ticket_tap/widgets/swippable_button.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  @override
  Widget build(BuildContext context) {
    double screenHeight = MediaQuery.of(context).size.height;
    double screenWidth = MediaQuery.of(context).size.width;

    return GradientScaffold(
      body: SizedBox(
        width: double.infinity,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal:  screenWidth * 0.1,
            vertical: screenHeight * 0.02
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Image.asset(
                'assets/images/example_logo.png',
                height: screenHeight * 0.4,
                width: screenWidth * 0.6,
              ),
              Text(
                "Welcome",
                style: AppStyles.welcomeText
              ),
              Text(
                "To",
                style: AppStyles.welcomeSubText,
              ),
              Text(
                "TicketTap",
                style: AppStyles.welcomeText,
              ),
              Text(
                "Your Digital Ticket to a Smarter Commute",
                style: AppStyles.sloganText,
              ),
              SizedBox(height: screenHeight * 0.05),
              SwipeableButton(
                onSwipeComplete: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SignIn()),
                  );
                }
              )
            ],
          ),
        ),
      )
    );
  }
}