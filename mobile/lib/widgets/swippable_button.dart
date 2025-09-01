import 'package:flutter/material.dart';
import 'package:ticket_tap/themes/AppColors.dart';
import 'package:ticket_tap/themes/AppStyles.dart';

class SwipeableButton extends StatefulWidget {
  final VoidCallback onSwipeComplete;

  const SwipeableButton({super.key, required this.onSwipeComplete});

  @override
  _SwipeableButtonState createState() => _SwipeableButtonState();
}

class _SwipeableButtonState extends State<SwipeableButton>
    with SingleTickerProviderStateMixin {
  double _dragValue = 0.0;
  final double _dragThreshold = 0.7;
  late AnimationController _animationController;
  late Animation<Offset> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _animation = Tween<Offset>(
      begin: const Offset(0, 0),
      end: const Offset(0.15, 0),
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails details) {
    setState(() {
      _dragValue += details.primaryDelta! / context.size!.width;
      if (_dragValue < 0) _dragValue = 0;
      if (_dragValue > 1) _dragValue = 1;
    });
  }

  void _onDragEnd(DragEndDetails details) {
    if (_dragValue > _dragThreshold) {
      widget.onSwipeComplete();
    } else {
      setState(() => _dragValue = 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    double screenHeight = MediaQuery.of(context).size.height;
    double screenWidth = MediaQuery.of(context).size.width;

    return GestureDetector(
      onHorizontalDragUpdate: _onDragUpdate,
      onHorizontalDragEnd: _onDragEnd,
      child: Container(
        height: screenHeight * 0.06,
        width: screenWidth * 0.9,
        decoration: BoxDecoration(
          color: AppColors.primaryColor,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Stack(
          children: [
            Center(
              child: Text(
                'Get Started',
                style: AppStyles.buttonText,
              ),
            ),
            Positioned(
              left: 5,
              top: 5,
              child: SlideTransition(
                position: _animation,
                child: Transform.translate(
                  offset: Offset(_dragValue * (screenWidth - 70), 0),
                  child: Container(
                    width: screenWidth * 0.13,
                    height: screenHeight * 0.05,
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_forward,
                      color: AppColors.primaryColor
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
