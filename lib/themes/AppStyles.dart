import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:ticket_tap/themes/AppColors.dart';

class AppStyles {
  static TextStyle welcomeText = TextStyle(
    fontSize: 50,
    fontWeight: FontWeight.w800,
    color: AppColors.primaryColor
  );
  static TextStyle welcomeSubText = TextStyle(
    fontSize: 50,
    fontWeight: FontWeight.w500,
    color: AppColors.primaryColor
  );
  static TextStyle sloganText = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.darkGray
  );
  static TextStyle buttonText= TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.white
  );
}