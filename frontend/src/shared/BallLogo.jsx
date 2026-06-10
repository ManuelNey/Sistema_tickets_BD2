import soccerBall from '../assets/pelota.png'

function BallLogo({ className = '' }) {
  return <img className={`ball-logo ${className}`} src={soccerBall} alt="" />
}

export default BallLogo
