<?php
/**
 * Quiz shortcode.
 *
 * Usage:
 *
 * [quiz]
 * [question]What's the right answer?[/question]
 * [wrong]This one?[explanation]Nope[/explanation][/wrong]
 * [answer]Yes, this is the one![explanation]Yay![/explanation][/answer]
 * [wrong]Maybe this one[explanation]Keep trying[/explanation][/wrong]
 * [wrong]How about this one?[explanation]Try again[/explanation][/wrong]
 * [/quiz]
 */
class Quiz_Shortcode {

	/**
	 * Parameters admitted by [quiz] shortcode.
	 *
	 * @since 4.5.0
	 *
	 * @var array
	 */
	private static $quiz_params = array();

	/**
	 * Whether the scripts were enqueued.
	 *
	 * @since 4.5.0
	 *
	 * @var bool
	 */
	private static $scripts_enqueued = false;

	/**
	 * In a8c training, store user currently logged in.
	 *
	 * @since 4.5.0
	 *
	 * @var null
	 */
	private static $username = null;

	/**
	 * Whether the noscript tag was already printed.
	 *
	 * @since 4.5.0
	 *
	 * @var bool
	 */
	private static $noscript_info_printed = false;

	/**
	 * Whether JavaScript is available.
	 *
	 * @since 4.5.0
	 *
	 * @var null
	 */
	private static $javascript_unavailable = null;

	/**
	 * Register all shortcodes.
	 *
	 * @since 4.5.0
	 */
	public static function init() {
		$obj = get_called_class();

		add_shortcode( 'quiz', array( $obj, 'shortcode' ) );
		add_shortcode( 'question', array( $obj, 'question_shortcode' ) );
		add_shortcode( 'answer', array( $obj, 'answer_shortcode' ) );
		add_shortcode( 'wrong', array( $obj, 'wrong_shortcode' ) );
		add_shortcode( 'explanation', array( $obj, 'explanation_shortcode' ) );
	}

	/**
	 * Enqueue assets needed by the quiz,
	 *
	 * @since 4.5.0
	 */
	private static function enqueue_scripts() {
		wp_enqueue_style( 'quiz', plugins_url( 'css/quiz.css', __FILE__ ) );
		wp_enqueue_script( 'quiz', plugins_url( 'js/quiz.js', __FILE__ ), array( 'jquery' ), null, true );
	}

	/**
	 * Check if this is a feed and thus JS is unavailable.
	 *
	 * @since 4.5.0
	 *
	 * @return bool|null
	 */
	private static function is_javascript_unavailable() {
		if ( ! is_null( self::$javascript_unavailable ) ) {
			return self::$javascript_unavailable;
		}

		if ( is_feed() ) {
			return self::$javascript_unavailable = true;
		}

		return self::$javascript_unavailable = false;
	}

	/**
	 * Display message when JS is not available.
	 *
	 * @since 4.5.0
	 *
	 * @return string
	 */
	private static function noscript_info() {
		if ( self::$noscript_info_printed ) {
			return '';
		}
		self::$noscript_info_printed = true;
		return '<noscript><div><i>' . esc_html__( 'Please view this post in your web browser to complete the quiz.', 'jetpack' ) . '</i></div></noscript>';
	}

	/**
	 * Parse shortcode arguments and render its output.
	 *
	 * @since 4.5.0
	 *
	 * @param array  $atts    Shortcode parameters.
	 * @param string $content Content enclosed by shortcode tags.
	 *
	 * @return string
	 */
	public static function shortcode( $atts, $content = null ) {
		$id = '';

		if ( self::is_javascript_unavailable() ) {
			// in an e-mail print the question and the info sentence once per question, too
			self::$noscript_info_printed = false;
		} else {

			if ( ! self::$scripts_enqueued ) {
				// lazy enqueue cannot use the wp_enqueue_scripts action anymore
				self::enqueue_scripts();
				self::$scripts_enqueued = true;
			}

			self::$quiz_params = shortcode_atts(
				array(
					'trackid' => '',
					'a8ctraining' => '',
				),
				$atts
			);

			if ( ! empty( self::$quiz_params[ 'trackid' ] ) ) {
				$id .= ' data-trackid="' . esc_attr( self::$quiz_params[ 'trackid' ] ) . '"';
			}
			if ( ! empty( self::$quiz_params[ 'a8ctraining' ] ) ) {
				if ( is_null( self::$username ) ) {
					self::$username = wp_get_current_user()->user_login;
				}
				$id .= ' data-a8ctraining="'. esc_attr( self::$quiz_params[ 'a8ctraining' ] ) . '" data-username="' . esc_attr( self::$username ) . '"';
			}
		}

		$quiz = self::do_shortcode( $content );
		return '<div class="quiz"' . $id . '>' . $quiz . '</div>'	;
	}

	/**
	 * Strip line breaks, restrict allowed HTML to a few whitelisted tags and execute nested shortcodes.
	 *
	 * @since 4.5.0
	 *
	 * @param string $content
	 *
	 * @return mixed|string
	 */
	private static function do_shortcode( $content ) {
		// strip autoinserted line breaks
		$content = preg_replace( '#(<(?:br /|/?p)>\n?)*(\[/?[a-z]+\])(<(?:br /|/?p)>\n?)*#', '$2', $content );
		$content = do_shortcode( $content );
		$content = wp_kses( $content, array(
			'tt' => array(),
			'pre' => array(),
			'strong' => array(),
			'i' => array(),
			'br' => array(),
			'img' => array( 'src' => true),
			'div' => array( 'class' => true, 'data-correct' => 1, 'data-track-id' => 1, 'data-a8ctraining' => 1, 'data-username' => 1 ),
		) );
		return $content;
	}

	/**
	 * Render question.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts
	 * @param null  $content
	 *
	 * @return string
	 */
	public static function question_shortcode( $atts, $content = null ) {
		return '<div class="question">' . self::do_shortcode( $content ) . '</div>';
	}

	/**
	 * Render correct answer.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts
	 * @param null  $content
	 *
	 * @return string
	 */
	public static function answer_shortcode( $atts, $content = null ) {
		if ( self::is_javascript_unavailable() ) {
			return self::noscript_info();
		}

		return '<div class="answer" data-correct="1">' . self::do_shortcode( $content ) . '</div>';
	}

	/**
	 * Render wrong response.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts
	 * @param null  $content
	 *
	 * @return string
	 */
	public static function wrong_shortcode( $atts, $content = null ) {
		if ( self::is_javascript_unavailable() ) {
			return self::noscript_info();
		}

		return '<div class="answer">' . self::do_shortcode( $content ) . '</div>';
	}

	/**
	 * Render explanation for wrong or right answer.
	 *
	 * @since 4.5.0
	 *
	 * @param array $atts
	 * @param null  $content
	 *
	 * @return string
	 */
	public static function explanation_shortcode( $atts, $content = null ) {
		if ( self::is_javascript_unavailable() ) {
			return self::noscript_info();
		}

		return '<div class="explanation">' . self::do_shortcode( $content ) . '</div>';
	}
}

Quiz_Shortcode::init();
