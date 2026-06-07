import soccerBall from '../assets/soccer-ball.svg'

function BallLogo({ className = '' }) {
  return <img className={`ball-logo ${className}`} src={soccerBall} alt="" />
}

export default BallLogo
