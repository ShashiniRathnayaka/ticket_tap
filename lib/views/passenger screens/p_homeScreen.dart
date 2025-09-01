import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/gradient_background.dart';

class PHomescreen extends StatelessWidget {
  const PHomescreen({super.key});

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      body: Center(
        child: Text("Passenger Dashboard"),
      )
    );
  }
}